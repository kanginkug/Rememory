package com.rememory.memory;

import com.rememory.common.exception.BusinessException;
import com.rememory.common.exception.ErrorCode;
import com.rememory.invitation.InvitationService;
import com.rememory.member.Member;
import com.rememory.member.MemberRepository;
import com.rememory.memory.dto.CreateMemoryRequestDTO;
import com.rememory.memory.dto.MemoryDetailResponseDTO;
import com.rememory.memory.dto.UpdateMemoryRequestDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class MemoryService {
    private final MemoryRepository memoryRepository;
    private final MemberRepository memberRepository;
    private final MemoryPhotoRepository mpRepository;
    private final MemberMemoryRepository mmRepository;
    private final InvitationService invitationService;
    // 프로필 이미지 저장 디렉터리 경로
    @Value("${upload.profile-dir:uploads/profile}")
    private String profileUploadDir;

    @Transactional
    public void createMemory(Long creatorId, CreateMemoryRequestDTO memory, MultipartFile file) {
        Member creator = memberRepository.findOne(creatorId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));

        Memory createMemory = Memory.create(creator, memory.getMemoryName(), memory.getDescription(), memory.getStartDate(), memory.getEndDate());
        memoryRepository.save(createMemory);

        MemberMemory createMemberMemory = MemberMemory.create(creator, createMemory);
        mmRepository.save(createMemberMemory);

        String photoUrl = "";
        if(file != null && !file.isEmpty()){
            photoUrl = madePhotoUrl(file);
        }

        if (photoUrl != null && !photoUrl.isEmpty()) {
            MemoryPhoto memoryPhoto = MemoryPhoto.create(createMemory, creator, photoUrl);
            mpRepository.save(memoryPhoto);
        }

        if (memory.getInvitedCnt() > 0) {
            invitationService.save(createMemory.getId(), creatorId, memory.getInvitedCnt());
        }
    }

    @Transactional
    public void updateMemory(Long memberId, Long memoryId, UpdateMemoryRequestDTO memory) {
        Member updater = memberRepository.findOne(memberId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));
        Memory updateMemory = memoryRepository.findOne(memoryId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMORY_NOT_FOUND));

        if (!updater.getId().equals(updateMemory.getCreator().getId())) {
            throw new BusinessException(ErrorCode.MEMORY_NOT_CREATOR);
        }

        updateMemory.update(memory.getMemoryName(), memory.getShowHistoryToNew(), memory.getDescription(), memory.getStartDate(), memory.getEndDate());
    }

    public List<MemoryDetailResponseDTO> findMemoryList(Long memberId, SortTypeMemory sortTypeMemory, String keyword) {

        List<Memory> memoryList = memoryRepository.findAllByMemberId(memberId, sortTypeMemory, keyword);
        List<MemoryDetailResponseDTO> mDResponseDTOList = new ArrayList<>();
        for(Memory memory : memoryList) {
            mDResponseDTOList.add(MemoryDetailResponseDTO.from(memory));
        }
        return mDResponseDTOList;
    }

    /** 해당 메모리에 해당 회원이 존재하는지 체크 */
    public MemberMemory findMemberMemory (Long memoryId, Long memberId) {
        return mmRepository.findByMemoryIdAndMemberId(memoryId, memberId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_MEMORY_NOT_FOUND));
    }

    public MemoryDetailResponseDTO findMemory(Long memberId, Long memoryId){
        if(memberRepository.findOne(memberId).isEmpty()) {
            throw new BusinessException(ErrorCode.MEMBER_NOT_FOUND);
        }
        if(mmRepository.findByMemoryIdAndMemberId(memoryId, memberId).isEmpty()) {
            throw new BusinessException(ErrorCode.MEMBER_MEMORY_NOT_FOUND);
        }
        Memory memory = memoryRepository.findOne(memoryId).orElseThrow(() -> new BusinessException(ErrorCode.MEMORY_NOT_FOUND));
        return MemoryDetailResponseDTO.from(memory);
    }

    /**
     * 추억 나가기
     * - leftAt 세팅
     * - 마지막 멤버가 나가면 Memory 자동 softDelete (고아 추억 방지)
     */
    @Transactional
    public void leftMemory(Long memoryId, Long memberId) {
        MemberMemory memberMemory = mmRepository.findByMemoryIdAndMemberId(memoryId, memberId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_MEMORY_NOT_FOUND));

        memberMemory.leftMemory();

        int remainCount = mmRepository.countActiveMembers(memoryId);
        if (remainCount == 0) {
            Memory memory = memoryRepository.findOne(memoryId)
                    .orElseThrow(() -> new BusinessException(ErrorCode.MEMORY_NOT_FOUND));
            memory.delete();
        }
    }

    /**
     * 추억 표지 사진 수정
     * 기존 사진 softDelete 후 새 사진 INSERT (이력 보존)
     */
    @Transactional
    public void updateMemoryPhoto(MultipartFile file, Long memoryId, Long updaterId) {
        Member updater = memberRepository.findOne(updaterId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));
        Memory memory = memoryRepository.findOne(memoryId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMORY_NOT_FOUND));

        if (mmRepository.findByMemoryIdAndMemberId(memoryId, updaterId).isEmpty()) {
            throw new BusinessException(ErrorCode.MEMBER_MEMORY_NOT_FOUND);
        }

        String imageUrl = madePhotoUrl(file);
        // 기존 사진 softDelete
        mpRepository.findOne(memoryId).ifPresent(MemoryPhoto::delete);

        // 새 사진 INSERT
        MemoryPhoto newPhoto = MemoryPhoto.create(memory, updater, imageUrl);
        mpRepository.save(newPhoto);
    }

    /** 추억 표지 사진 삭제 */
    @Transactional
    public void deleteMemoryPhoto(Long memoryId, Long deleterId) {
        if (memberRepository.findOne(deleterId).isEmpty()) {
            throw new BusinessException(ErrorCode.MEMBER_NOT_FOUND);
        }
        if (memoryRepository.findOne(memoryId).isEmpty()) {
            throw new BusinessException(ErrorCode.MEMORY_NOT_FOUND);
        }
        if (mmRepository.findByMemoryIdAndMemberId(memoryId, deleterId).isEmpty()) {
            throw new BusinessException(ErrorCode.MEMBER_MEMORY_NOT_FOUND);
        }

        MemoryPhoto memoryPhoto = mpRepository.findOne(memoryId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMORY_PHOTO_NOT_FOUND));
        memoryPhoto.delete();
    }

    // MIME 타입 검증 후 UUID 파일명 리턴
    // MIME 타입 기반 검증만 수행하며 Magic Bytes 검증은 미구현 (TODO S8)
    public String madePhotoUrl(MultipartFile file) {

        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new BusinessException(ErrorCode.INVALID_FILE_TYPE);
        }

        String ext = StringUtils.getFilenameExtension(file.getOriginalFilename());
        String savedFileName = UUID.randomUUID() + (ext != null ? "." + ext : "");
        Path savePath = Paths.get(profileUploadDir, savedFileName).toAbsolutePath();

        try {
            Files.createDirectories(savePath.getParent());
            Files.copy(file.getInputStream(), savePath, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new BusinessException(ErrorCode.FILE_UPLOAD_FAILED);
        }

        return "/uploads/profile/" + savedFileName;
    }
}
