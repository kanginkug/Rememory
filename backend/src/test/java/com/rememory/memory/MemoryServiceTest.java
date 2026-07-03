package com.rememory.memory;

import com.rememory.common.exception.BusinessException;
import com.rememory.common.exception.ErrorCode;
import com.rememory.common.s3.service.UploadService;
import com.rememory.member.Member;
import com.rememory.member.MemberRepository;
import com.rememory.memory.dto.CreateMemoryRequestDTO;
import com.rememory.memory.dto.MemoryDetailResponseDTO;
import com.rememory.memory.dto.MemoryListResponseDTO;
import com.rememory.memory.dto.MemoryPhotoRequestDTO;
import com.rememory.memory.dto.UpdateMemoryRequestDTO;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.verify;

@SpringBootTest
@Transactional
class MemoryServiceTest {

    @Autowired MemoryService memoryService;
    @Autowired MemoryRepository memoryRepository;
    @Autowired MemberMemoryRepository mmRepository;
    @Autowired MemoryPhotoRepository mpRepository;
    @Autowired MemberRepository memberRepository;
    @MockitoBean UploadService uploadService;
    @PersistenceContext EntityManager em;

    private Member member;
    private Member otherMember;

    private static final String TEST_PHOTO_URL = "https://test.s3.amazonaws.com/photo.jpg";
    private static final String TEST_PHOTO_URL_NEW = "https://test.s3.amazonaws.com/new-photo.jpg";

    @BeforeEach
    void setUp() {
        member = Member.create("홍길동", "hong@gmail.com", "http://img/1", "KAKAO", "kakao_111", null, null);
        memberRepository.save(member);

        otherMember = Member.create("김철수", "kim@gmail.com", "http://img/2", "KAKAO", "kakao_222", null, null);
        memberRepository.save(otherMember);
    }

    // ===== createMemory =====

    @Test
    @DisplayName("추억 생성 성공")
    void createMemory_성공() {
        memoryService.createMemory(member.getId(), createMemoryDto("제주도 여행", "즐거운 여행"));

        List<Memory> memories = memoryRepository.findAllByMemberId(member.getId(), SortTypeMemory.DATE_DESC, null);
        assertThat(memories).hasSize(1);
        assertThat(memories.get(0).getName()).isEqualTo("제주도 여행");
    }

    @Test
    @DisplayName("추억 생성 시 creator가 MemberMemory에 자동 추가")
    void createMemory_creator_MemberMemory_자동추가() {
        memoryService.createMemory(member.getId(), createMemoryDto("제주도 여행", "즐거운 여행"));
        Memory memory = memoryRepository.findAllByMemberId(member.getId(), SortTypeMemory.DATE_DESC, null).get(0);

        List<MemberMemory> memberMemories = mmRepository.findActiveByMemoryId(memory.getId());
        assertThat(memberMemories).hasSize(1);
        assertThat(memberMemories.get(0).getMember().getId()).isEqualTo(member.getId());
    }

    @Test
    @DisplayName("추억 생성 시 사진 URL 있으면 MemoryPhoto 저장")
    void createMemory_사진_저장() {
        memoryService.createMemory(member.getId(), createMemoryDtoWithPhoto("제주도 여행", "즐거운 여행", TEST_PHOTO_URL));
        Memory memory = memoryRepository.findAllByMemberId(member.getId(), SortTypeMemory.DATE_DESC, null).get(0);

        assertThat(mpRepository.findOne(memory.getId())).isPresent();
        assertThat(mpRepository.findOne(memory.getId()).get().getImageUrl()).isEqualTo(TEST_PHOTO_URL);
    }

    @Test
    @DisplayName("추억 생성 시 사진 URL 없으면 MemoryPhoto 저장 안 됨")
    void createMemory_사진없으면_미저장() {
        memoryService.createMemory(member.getId(), createMemoryDto("제주도 여행", "즐거운 여행"));
        Memory memory = memoryRepository.findAllByMemberId(member.getId(), SortTypeMemory.DATE_DESC, null).get(0);

        assertThat(mpRepository.findOne(memory.getId())).isEmpty();
    }

    @Test
    @DisplayName("추억 생성 시 createdAt 자동 세팅")
    void createMemory_createdAt_자동세팅() {
        memoryService.createMemory(member.getId(), createMemoryDto("제주도 여행", "즐거운 여행"));

        List<Memory> memories = memoryRepository.findAllByMemberId(member.getId(), SortTypeMemory.DATE_DESC, null);
        assertThat(memories.get(0).getCreatedAt()).isNotNull();
    }

    @Test
    @DisplayName("없는 멤버로 추억 생성 시 BusinessException 발생")
    void createMemory_없는멤버_예외발생() {
        assertThatThrownBy(() -> memoryService.createMemory(999999L, createMemoryDto("제주도 여행", "즐거운 여행")))
                .isInstanceOf(BusinessException.class)
                .hasMessage(ErrorCode.MEMBER_NOT_FOUND.getMessage());
    }

    // ===== updateMemory =====

    @Test
    @DisplayName("추억 수정 성공")
    void updateMemory_성공() {
        memoryService.createMemory(member.getId(), createMemoryDto("제주도 여행", "즐거운 여행"));
        Memory memory = memoryRepository.findAllByMemberId(member.getId(), SortTypeMemory.DATE_DESC, null).get(0);

        memoryService.updateMemory(member.getId(), memory.getId(), updateMemoryDto("부산 여행", "맛있는 여행"));

        Memory updated = memoryRepository.findOne(memory.getId()).get();
        assertThat(updated.getName()).isEqualTo("부산 여행");
        assertThat(updated.getDescription()).isEqualTo("맛있는 여행");
    }

    @Test
    @DisplayName("추억 수정 시 showHistoryToNew 변경")
    void updateMemory_showHistoryToNew_변경() {
        memoryService.createMemory(member.getId(), createMemoryDto("제주도 여행", "즐거운 여행"));
        Memory memory = memoryRepository.findAllByMemberId(member.getId(), SortTypeMemory.DATE_DESC, null).get(0);

        memoryService.updateMemory(member.getId(), memory.getId(), new UpdateMemoryRequestDTO("부산 여행", "맛있는 여행",
                LocalDate.of(2026, 5, 1), LocalDate.of(2026, 5, 5), false));

        Memory updated = memoryRepository.findOne(memory.getId()).get();
        assertThat(updated.getShowHistoryToNew()).isFalse();
    }

    @Test
    @DisplayName("creator가 아닌 멤버가 수정 시 BusinessException 발생")
    void updateMemory_권한없음_예외발생() {
        memoryService.createMemory(member.getId(), createMemoryDto("제주도 여행", "즐거운 여행"));
        Memory memory = memoryRepository.findAllByMemberId(member.getId(), SortTypeMemory.DATE_DESC, null).get(0);

        assertThatThrownBy(() -> memoryService.updateMemory(otherMember.getId(), memory.getId(), updateMemoryDto("부산 여행", "맛있는 여행")))
                .isInstanceOf(BusinessException.class)
                .hasMessage(ErrorCode.MEMORY_NOT_CREATOR.getMessage());
    }

    @Test
    @DisplayName("없는 추억 수정 시 BusinessException 발생")
    void updateMemory_없는추억_예외발생() {
        assertThatThrownBy(() -> memoryService.updateMemory(member.getId(), 9999L, updateMemoryDto("부산 여행", "맛있는 여행")))
                .isInstanceOf(BusinessException.class)
                .hasMessage(ErrorCode.MEMORY_NOT_FOUND.getMessage());
    }

    // ===== findMemoryList =====

    @Test
    @DisplayName("내 추억 목록 조회 - 최신순")
    void findMemoryList_최신순() {
        memoryService.createMemory(member.getId(), createMemoryDto("첫번째 여행", "설명1"));
        memoryService.createMemory(member.getId(), createMemoryDto("두번째 여행", "설명2"));

        List<MemoryListResponseDTO> memories = memoryService.findMemoryList(member.getId(), SortTypeMemory.DATE_DESC, null);

        assertThat(memories).hasSize(2);
        assertThat(memories.get(0).getName()).isEqualTo("두번째 여행");
    }

    @Test
    @DisplayName("내 추억 목록 조회 - 키워드 검색")
    void findMemoryList_키워드검색() {
        memoryService.createMemory(member.getId(), createMemoryDto("제주도 여행", "설명1"));
        memoryService.createMemory(member.getId(), createMemoryDto("부산 여행", "설명2"));
        memoryService.createMemory(member.getId(), createMemoryDto("서울 나들이", "설명3"));

        List<MemoryListResponseDTO> memories = memoryService.findMemoryList(member.getId(), SortTypeMemory.DATE_DESC, "여행");

        assertThat(memories).hasSize(2);
    }

    @Test
    @DisplayName("다른 멤버의 추억은 조회 안 됨")
    void findMemoryList_다른멤버_추억_미조회() {
        memoryService.createMemory(member.getId(), createMemoryDto("제주도 여행", "설명1"));
        memoryService.createMemory(otherMember.getId(), createMemoryDto("부산 여행", "설명2"));

        List<MemoryListResponseDTO> memories = memoryService.findMemoryList(member.getId(), SortTypeMemory.DATE_DESC, null);

        assertThat(memories).hasSize(1);
        assertThat(memories.get(0).getName()).isEqualTo("제주도 여행");
    }

    // ===== leftMemory =====

    @Test
    @DisplayName("추억 나가기 성공 - leftAt 세팅")
    void leftMemory_성공() {
        memoryService.createMemory(member.getId(), createMemoryDto("제주도 여행", "즐거운 여행"));
        Memory memory = memoryRepository.findAllByMemberId(member.getId(), SortTypeMemory.DATE_DESC, null).get(0);

        memoryService.leftMemory(memory.getId(), member.getId());

        MemberMemory memberMemory = em.createQuery(
                "select mm from MemberMemory mm where mm.memory.id = :memoryId and mm.member.id = :memberId",
                MemberMemory.class)
                .setParameter("memoryId", memory.getId())
                .setParameter("memberId", member.getId())
                .getSingleResult();

        assertThat(memberMemory.getLeftAt()).isNotNull();
    }

    @Test
    @DisplayName("마지막 멤버 나가면 Memory 자동 softDelete")
    void leftMemory_마지막멤버_자동삭제() {
        memoryService.createMemory(member.getId(), createMemoryDto("제주도 여행", "즐거운 여행"));
        Memory memory = memoryRepository.findAllByMemberId(member.getId(), SortTypeMemory.DATE_DESC, null).get(0);

        memoryService.leftMemory(memory.getId(), member.getId());

        Memory deleted = memoryRepository.findOne(memory.getId()).get();
        assertThat(deleted.getDeletedAt()).isNotNull();
    }

    @Test
    @DisplayName("멤버가 남아있으면 나가도 Memory 유지")
    void leftMemory_멤버남으면_Memory유지() {
        memoryService.createMemory(member.getId(), createMemoryDto("제주도 여행", "즐거운 여행"));
        Memory memory = memoryRepository.findAllByMemberId(member.getId(), SortTypeMemory.DATE_DESC, null).get(0);

        MemberMemory otherMemberMemory = MemberMemory.create(otherMember, memory);
        mmRepository.save(otherMemberMemory);

        memoryService.leftMemory(memory.getId(), member.getId());

        Memory found = memoryRepository.findOne(memory.getId()).get();
        assertThat(found.getDeletedAt()).isNull();
    }

    @Test
    @DisplayName("나간 후 추억 목록에서 조회 안 됨")
    void leftMemory_나간후_목록미조회() {
        memoryService.createMemory(member.getId(), createMemoryDto("제주도 여행", "즐거운 여행"));
        Memory memory = memoryRepository.findAllByMemberId(member.getId(), SortTypeMemory.DATE_DESC, null).get(0);

        memoryService.leftMemory(memory.getId(), member.getId());

        List<MemoryListResponseDTO> memories = memoryService.findMemoryList(member.getId(), SortTypeMemory.DATE_DESC, null);
        assertThat(memories).isEmpty();
    }

    @Test
    @DisplayName("참가하지 않은 추억 나가기 시 BusinessException 발생")
    void leftMemory_미참가_예외발생() {
        memoryService.createMemory(member.getId(), createMemoryDto("제주도 여행", "즐거운 여행"));
        Memory memory = memoryRepository.findAllByMemberId(member.getId(), SortTypeMemory.DATE_DESC, null).get(0);

        assertThatThrownBy(() -> memoryService.leftMemory(memory.getId(), otherMember.getId()))
                .isInstanceOf(BusinessException.class)
                .hasMessage(ErrorCode.MEMBER_MEMORY_NOT_FOUND.getMessage());
    }

    // ===== findMemberMemory =====

    @Test
    @DisplayName("MemberMemory 조회 성공")
    void findMemberMemory_성공() {
        memoryService.createMemory(member.getId(), createMemoryDto("제주도 여행", "즐거운 여행"));
        Memory memory = memoryRepository.findAllByMemberId(member.getId(), SortTypeMemory.DATE_DESC, null).get(0);

        MemberMemory memberMemory = memoryService.findMemberMemory(memory.getId(), member.getId());

        assertThat(memberMemory).isNotNull();
        assertThat(memberMemory.getMember().getId()).isEqualTo(member.getId());
    }

    @Test
    @DisplayName("참가하지 않은 멤버 조회 시 BusinessException 발생")
    void findMemberMemory_미참가_예외발생() {
        memoryService.createMemory(member.getId(), createMemoryDto("제주도 여행", "즐거운 여행"));
        Memory memory = memoryRepository.findAllByMemberId(member.getId(), SortTypeMemory.DATE_DESC, null).get(0);

        assertThatThrownBy(() -> memoryService.findMemberMemory(memory.getId(), otherMember.getId()))
                .isInstanceOf(BusinessException.class)
                .hasMessage(ErrorCode.MEMBER_MEMORY_NOT_FOUND.getMessage());
    }

    // ===== findMemory =====

    @Test
    @DisplayName("추억 단건 조회 성공")
    void findMemory_성공() {
        memoryService.createMemory(member.getId(), createMemoryDto("제주도 여행", "즐거운 여행"));
        Memory memory = memoryRepository.findAllByMemberId(member.getId(), SortTypeMemory.DATE_DESC, null).get(0);

        MemoryDetailResponseDTO found = memoryService.findMemory(member.getId(), memory.getId());

        assertThat(found).isNotNull();
        assertThat(found.getName()).isEqualTo("제주도 여행");
    }

    @Test
    @DisplayName("없는 멤버로 추억 단건 조회 시 BusinessException 발생")
    void findMemory_없는멤버_예외발생() {
        memoryService.createMemory(member.getId(), createMemoryDto("제주도 여행", "즐거운 여행"));
        Memory memory = memoryRepository.findAllByMemberId(member.getId(), SortTypeMemory.DATE_DESC, null).get(0);

        assertThatThrownBy(() -> memoryService.findMemory(999999L, memory.getId()))
                .isInstanceOf(BusinessException.class)
                .hasMessage(ErrorCode.MEMBER_MEMORY_NOT_FOUND.getMessage());
    }

    @Test
    @DisplayName("참가하지 않은 멤버가 추억 단건 조회 시 BusinessException 발생")
    void findMemory_미참가멤버_예외발생() {
        memoryService.createMemory(member.getId(), createMemoryDto("제주도 여행", "즐거운 여행"));
        Memory memory = memoryRepository.findAllByMemberId(member.getId(), SortTypeMemory.DATE_DESC, null).get(0);

        assertThatThrownBy(() -> memoryService.findMemory(otherMember.getId(), memory.getId()))
                .isInstanceOf(BusinessException.class)
                .hasMessage(ErrorCode.MEMBER_MEMORY_NOT_FOUND.getMessage());
    }

    // ===== saveMemoryPhoto =====

    @Test
    @DisplayName("표지 사진 저장 성공")
    void saveMemoryPhoto_성공() {
        memoryService.createMemory(member.getId(), createMemoryDto("제주도 여행", "즐거운 여행"));
        Memory memory = memoryRepository.findAllByMemberId(member.getId(), SortTypeMemory.DATE_DESC, null).get(0);

        memoryService.saveMemoryPhoto(new MemoryPhotoRequestDTO(TEST_PHOTO_URL), memory.getId(), member.getId());

        MemoryPhoto photo = mpRepository.findOne(memory.getId()).get();
        assertThat(photo.getImageUrl()).isEqualTo(TEST_PHOTO_URL);
        assertThat(photo.getMember().getId()).isEqualTo(member.getId());
    }

    @Test
    @DisplayName("사진이 이미 존재하면 기존 사진을 삭제하고 새 사진으로 교체")
    void saveMemoryPhoto_이미존재_교체() {
        memoryService.createMemory(member.getId(), createMemoryDtoWithPhoto("제주도 여행", "즐거운 여행", TEST_PHOTO_URL));
        Memory memory = memoryRepository.findAllByMemberId(member.getId(), SortTypeMemory.DATE_DESC, null).get(0);
        MemoryPhoto oldPhoto = mpRepository.findOne(memory.getId()).get();

        memoryService.saveMemoryPhoto(new MemoryPhotoRequestDTO(TEST_PHOTO_URL_NEW), memory.getId(), member.getId());

        MemoryPhoto newPhoto = mpRepository.findOne(memory.getId()).get();
        assertThat(newPhoto.getId()).isNotEqualTo(oldPhoto.getId());
        assertThat(newPhoto.getImageUrl()).isEqualTo(TEST_PHOTO_URL_NEW);
        verify(uploadService).delete(TEST_PHOTO_URL);
    }

    @Test
    @DisplayName("참가하지 않은 멤버가 사진 저장 시 BusinessException 발생")
    void saveMemoryPhoto_권한없음_예외발생() {
        memoryService.createMemory(member.getId(), createMemoryDto("제주도 여행", "즐거운 여행"));
        Memory memory = memoryRepository.findAllByMemberId(member.getId(), SortTypeMemory.DATE_DESC, null).get(0);

        assertThatThrownBy(() -> memoryService.saveMemoryPhoto(new MemoryPhotoRequestDTO(TEST_PHOTO_URL), memory.getId(), otherMember.getId()))
                .isInstanceOf(BusinessException.class)
                .hasMessage(ErrorCode.MEMBER_MEMORY_NOT_FOUND.getMessage());
    }

    // ===== deleteMemoryPhoto =====

    @Test
    @DisplayName("표지 사진 삭제 성공 - deletedAt 세팅")
    void deleteMemoryPhoto_성공() {
        memoryService.createMemory(member.getId(), createMemoryDtoWithPhoto("제주도 여행", "즐거운 여행", TEST_PHOTO_URL));
        Memory memory = memoryRepository.findAllByMemberId(member.getId(), SortTypeMemory.DATE_DESC, null).get(0);

        memoryService.deleteMemoryPhoto(memory.getId(), member.getId());

        assertThat(mpRepository.findOne(memory.getId())).isEmpty();
    }

    @Test
    @DisplayName("사진 없는 추억 삭제 시 BusinessException 발생")
    void deleteMemoryPhoto_사진없음_예외발생() {
        memoryService.createMemory(member.getId(), createMemoryDto("제주도 여행", "즐거운 여행"));
        Memory memory = memoryRepository.findAllByMemberId(member.getId(), SortTypeMemory.DATE_DESC, null).get(0);

        assertThatThrownBy(() -> memoryService.deleteMemoryPhoto(memory.getId(), member.getId()))
                .isInstanceOf(BusinessException.class)
                .hasMessage(ErrorCode.MEMORY_PHOTO_NOT_FOUND.getMessage());
    }

    @Test
    @DisplayName("참가하지 않은 멤버가 사진 삭제 시 BusinessException 발생")
    void deleteMemoryPhoto_권한없음_예외발생() {
        memoryService.createMemory(member.getId(), createMemoryDtoWithPhoto("제주도 여행", "즐거운 여행", TEST_PHOTO_URL));
        Memory memory = memoryRepository.findAllByMemberId(member.getId(), SortTypeMemory.DATE_DESC, null).get(0);

        assertThatThrownBy(() -> memoryService.deleteMemoryPhoto(memory.getId(), otherMember.getId()))
                .isInstanceOf(BusinessException.class)
                .hasMessage(ErrorCode.MEMBER_MEMORY_NOT_FOUND.getMessage());
    }

    // ===== 헬퍼 메서드 =====

    private CreateMemoryRequestDTO createMemoryDto(String name, String description) {
        return new CreateMemoryRequestDTO(name, description, 0, null,
                LocalDate.of(2026, 5, 1), LocalDate.of(2026, 5, 5));
    }

    private CreateMemoryRequestDTO createMemoryDtoWithPhoto(String name, String description, String photoUrl) {
        return new CreateMemoryRequestDTO(name, description, 0, photoUrl,
                LocalDate.of(2026, 5, 1), LocalDate.of(2026, 5, 5));
    }

    private UpdateMemoryRequestDTO updateMemoryDto(String name, String description) {
        return new UpdateMemoryRequestDTO(name, description,
                LocalDate.of(2026, 5, 1), LocalDate.of(2026, 5, 5), true);
    }
}
