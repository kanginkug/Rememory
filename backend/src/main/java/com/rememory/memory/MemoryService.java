package com.rememory.memory;

import com.rememory.common.commonEnum.SortType;
import com.rememory.common.exception.BusinessException;
import com.rememory.common.exception.ErrorCode;
import com.rememory.member.Member;
import com.rememory.member.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class MemoryService {
    private final MemoryRepository memoryRepository;
    private final MemberRepository memberRepository;
    private final MemoryPhotoRepository mpRepository;
    private final MemberMemoryRepository mmRepository;

    @Transactional
    public void createMemory(Long creatorId, CreateMemoryRequestDTO memory) {
        Member creator = memberRepository.findOne(creatorId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));

        Memory createMemory = Memory.create(creator, memory.getMemoryName(), memory.getDescription(), memory.getStartDate(), memory.getEndDate());
        memoryRepository.save(createMemory);

        MemberMemory createMemberMemory = MemberMemory.create(creator, createMemory);
        mmRepository.save(createMemberMemory);

        if (memory.getPhotoUrl() != null && !memory.getPhotoUrl().isEmpty()) {
            MemoryPhoto memoryPhoto = MemoryPhoto.create(createMemory, creator, memory.getPhotoUrl());
            mpRepository.save(memoryPhoto);
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

    public List<Memory> findMemoryList(Long memberId, SortType sortType, String keyword) {
        return memoryRepository.findAllByMemberId(memberId, sortType, keyword);
    }

    @Transactional
    public void deleteMemory(Long memberId, Long memoryId) {
        Member deleter = memberRepository.findOne(memberId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));
        Memory deleteMemory = memoryRepository.findOne(memoryId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMORY_NOT_FOUND));

        if (!deleter.getId().equals(deleteMemory.getCreator().getId())) {
            throw new BusinessException(ErrorCode.MEMORY_NOT_CREATOR);
        }
        deleteMemory.delete();
    }

    /** 해당 메모리에 해당 회원이 존재하는지 체크 */
    public MemberMemory findOne(Long memoryId, Long memberId) {
        return mmRepository.findByMemoryIdAndMemberId(memoryId, memberId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_MEMORY_NOT_FOUND));
    }

    @Transactional
    public void leftMemory(Long memoryId, Long memberId) {
        MemberMemory memberMemory = mmRepository.findByMemoryIdAndMemberId(memoryId, memberId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_MEMORY_NOT_FOUND));
        memberMemory.leftMemory();
    }

    /**
     * 추억 표지 사진 수정
     * 기존 사진 softDelete 후 새 사진 INSERT (이력 보존)
     */
    @Transactional
    public void updateMemoryPhoto(Long memoryId, Long updaterId, String imageUrl) {
        Member updater = memberRepository.findOne(updaterId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));
        Memory memory = memoryRepository.findOne(memoryId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMORY_NOT_FOUND));

        if (mmRepository.findByMemoryIdAndMemberId(memoryId, updaterId).isEmpty()) {
            throw new BusinessException(ErrorCode.MEMBER_MEMORY_NOT_FOUND);
        }

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
}
