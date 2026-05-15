package com.rememory.memory;

import com.rememory.common.commonEnum.SortType;
import com.rememory.common.exception.BusinessException;
import com.rememory.common.exception.ErrorCode;
import com.rememory.member.Member;
import com.rememory.member.MemberRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.*;

@SpringBootTest
@Transactional
class MemoryServiceTest {

    @Autowired MemoryService memoryService;
    @Autowired MemoryRepository memoryRepository;
    @Autowired MemberMemoryRepository mmRepository;
    @Autowired MemoryPhotoRepository mpRepository;
    @Autowired MemberRepository memberRepository;

    private Member member;
    private Member otherMember;

    @BeforeEach
    void setUp() {
        member = Member.create("홍길동", "hong@gmail.com", "KAKAO", "kakao_111", "http://img/1");
        memberRepository.save(member);

        otherMember = Member.create("김철수", "kim@gmail.com", "KAKAO", "kakao_222", "http://img/2");
        memberRepository.save(otherMember);
    }

    // ===== createMemory =====

    @Test
    @DisplayName("추억 생성 성공")
    void createMemory_성공() {
        memoryService.createMemory(member.getId(), createMemoryDto("제주도 여행", "즐거운 여행", null));

        List<Memory> memories = memoryRepository.findAllByMemberId(member.getId(), SortType.DATE_DESC, null);
        assertThat(memories).hasSize(1);
        assertThat(memories.get(0).getName()).isEqualTo("제주도 여행");
    }

    @Test
    @DisplayName("추억 생성 시 creator가 MemberMemory에 자동 추가")
    void createMemory_creator_MemberMemory_자동추가() {
        memoryService.createMemory(member.getId(), createMemoryDto("제주도 여행", "즐거운 여행", null));
        Memory memory = memoryRepository.findAllByMemberId(member.getId(), SortType.DATE_DESC, null).get(0);

        List<MemberMemory> memberMemories = mmRepository.findAll(memory.getId());
        assertThat(memberMemories).hasSize(1);
        assertThat(memberMemories.get(0).getMember().getId()).isEqualTo(member.getId());
    }

    @Test
    @DisplayName("추억 생성 시 사진 URL 있으면 MemoryPhoto 저장")
    void createMemory_사진_저장() {
        memoryService.createMemory(member.getId(), createMemoryDto("제주도 여행", "즐거운 여행", "http://photo.img/1"));
        Memory memory = memoryRepository.findAllByMemberId(member.getId(), SortType.DATE_DESC, null).get(0);

        assertThat(mpRepository.findOne(memory.getId())).isPresent();
        assertThat(mpRepository.findOne(memory.getId()).get().getImageUrl()).isEqualTo("http://photo.img/1");
    }

    @Test
    @DisplayName("추억 생성 시 사진 URL 없으면 MemoryPhoto 저장 안 됨")
    void createMemory_사진없으면_미저장() {
        memoryService.createMemory(member.getId(), createMemoryDto("제주도 여행", "즐거운 여행", null));
        Memory memory = memoryRepository.findAllByMemberId(member.getId(), SortType.DATE_DESC, null).get(0);

        assertThat(mpRepository.findOne(memory.getId())).isEmpty();
    }

    @Test
    @DisplayName("추억 생성 시 createdAt 자동 세팅")
    void createMemory_createdAt_자동세팅() {
        memoryService.createMemory(member.getId(), createMemoryDto("제주도 여행", "즐거운 여행", null));

        List<Memory> memories = memoryRepository.findAllByMemberId(member.getId(), SortType.DATE_DESC, null);
        assertThat(memories.get(0).getCreatedAt()).isNotNull();
    }

    @Test
    @DisplayName("없는 멤버로 추억 생성 시 BusinessException 발생")
    void createMemory_없는멤버_예외발생() {
        assertThatThrownBy(() -> memoryService.createMemory(999999L, createMemoryDto("제주도 여행", "즐거운 여행", null)))
                .isInstanceOf(BusinessException.class)
                .hasMessage(ErrorCode.MEMBER_NOT_FOUND.getMessage());
    }

    // ===== updateMemory =====

    @Test
    @DisplayName("추억 수정 성공")
    void updateMemory_성공() {
        memoryService.createMemory(member.getId(), createMemoryDto("제주도 여행", "즐거운 여행", null));
        Memory memory = memoryRepository.findAllByMemberId(member.getId(), SortType.DATE_DESC, null).get(0);

        memoryService.updateMemory(member.getId(), memory.getId(), updateMemoryDto("부산 여행", "맛있는 여행"));

        Memory updated = memoryRepository.findOne(memory.getId()).get();
        assertThat(updated.getName()).isEqualTo("부산 여행");
        assertThat(updated.getDescription()).isEqualTo("맛있는 여행");
    }

    @Test
    @DisplayName("creator가 아닌 멤버가 수정 시 BusinessException 발생")
    void updateMemory_권한없음_예외발생() {
        memoryService.createMemory(member.getId(), createMemoryDto("제주도 여행", "즐거운 여행", null));
        Memory memory = memoryRepository.findAllByMemberId(member.getId(), SortType.DATE_DESC, null).get(0);

        assertThatThrownBy(() -> memoryService.updateMemory(otherMember.getId(), memory.getId(), updateMemoryDto("부산 여행", "맛있는 여행")))
                .isInstanceOf(BusinessException.class)
                .hasMessage(ErrorCode.MEMORY_NOT_CREATOR.getMessage());
    }

    @Test
    @DisplayName("없는 추억 수정 시 BusinessException 발생")
    void updateMemory_없는추억_예외발생() {
        assertThatThrownBy(() -> memoryService.updateMemory(member.getId(), 999999L, updateMemoryDto("부산 여행", "맛있는 여행")))
                .isInstanceOf(BusinessException.class)
                .hasMessage(ErrorCode.MEMORY_NOT_FOUND.getMessage());
    }

    // ===== findMemoryList =====

    @Test
    @DisplayName("내 추억 목록 조회 - 최신순")
    void findMemoryList_최신순() {
        memoryService.createMemory(member.getId(), createMemoryDto("첫번째 여행", "설명1", null));
        memoryService.createMemory(member.getId(), createMemoryDto("두번째 여행", "설명2", null));

        List<Memory> memories = memoryService.findMemoryList(member.getId(), SortType.DATE_DESC, null);

        assertThat(memories).hasSize(2);
        assertThat(memories.get(0).getName()).isEqualTo("두번째 여행");
    }

    @Test
    @DisplayName("내 추억 목록 조회 - 키워드 검색")
    void findMemoryList_키워드검색() {
        memoryService.createMemory(member.getId(), createMemoryDto("제주도 여행", "설명1", null));
        memoryService.createMemory(member.getId(), createMemoryDto("부산 여행", "설명2", null));
        memoryService.createMemory(member.getId(), createMemoryDto("서울 나들이", "설명3", null));

        List<Memory> memories = memoryService.findMemoryList(member.getId(), SortType.DATE_DESC, "여행");

        assertThat(memories).hasSize(2);
    }

    @Test
    @DisplayName("다른 멤버의 추억은 조회 안 됨")
    void findMemoryList_다른멤버_추억_미조회() {
        memoryService.createMemory(member.getId(), createMemoryDto("제주도 여행", "설명1", null));
        memoryService.createMemory(otherMember.getId(), createMemoryDto("부산 여행", "설명2", null));

        List<Memory> memories = memoryService.findMemoryList(member.getId(), SortType.DATE_DESC, null);

        assertThat(memories).hasSize(1);
        assertThat(memories.get(0).getName()).isEqualTo("제주도 여행");
    }

    // ===== deleteMemory =====

    @Test
    @DisplayName("추억 삭제 성공 - deletedAt 세팅")
    void deleteMemory_성공() {
        memoryService.createMemory(member.getId(), createMemoryDto("제주도 여행", "즐거운 여행", null));
        Memory memory = memoryRepository.findAllByMemberId(member.getId(), SortType.DATE_DESC, null).get(0);

        memoryService.deleteMemory(member.getId(), memory.getId());

        Memory deleted = memoryRepository.findOne(memory.getId()).get();
        assertThat(deleted.getDeletedAt()).isNotNull();
    }

    @Test
    @DisplayName("creator가 아닌 멤버가 삭제 시 BusinessException 발생")
    void deleteMemory_권한없음_예외발생() {
        memoryService.createMemory(member.getId(), createMemoryDto("제주도 여행", "즐거운 여행", null));
        Memory memory = memoryRepository.findAllByMemberId(member.getId(), SortType.DATE_DESC, null).get(0);

        assertThatThrownBy(() -> memoryService.deleteMemory(otherMember.getId(), memory.getId()))
                .isInstanceOf(BusinessException.class)
                .hasMessage(ErrorCode.MEMORY_NOT_CREATOR.getMessage());
    }

    @Test
    @DisplayName("삭제된 추억은 목록에서 조회 안 됨")
    void deleteMemory_삭제후_목록미조회() {
        memoryService.createMemory(member.getId(), createMemoryDto("제주도 여행", "즐거운 여행", null));
        Memory memory = memoryRepository.findAllByMemberId(member.getId(), SortType.DATE_DESC, null).get(0);

        memoryService.deleteMemory(member.getId(), memory.getId());

        List<Memory> memories = memoryService.findMemoryList(member.getId(), SortType.DATE_DESC, null);
        assertThat(memories).isEmpty();
    }

    // ===== leftMemory =====

    @Test
    @DisplayName("추억 탈퇴 성공 - leftAt 세팅")
    void leftMemory_성공() {
        memoryService.createMemory(member.getId(), createMemoryDto("제주도 여행", "즐거운 여행", null));
        Memory memory = memoryRepository.findAllByMemberId(member.getId(), SortType.DATE_DESC, null).get(0);

        memoryService.leftMemory(memory.getId(), member.getId());

        MemberMemory memberMemory = mmRepository.findByMemoryIdAndMemberId(memory.getId(), member.getId()).get();
        assertThat(memberMemory.getLeftAt()).isNotNull();
    }

    @Test
    @DisplayName("탈퇴 후 추억 목록에서 조회 안 됨")
    void leftMemory_탈퇴후_목록미조회() {
        memoryService.createMemory(member.getId(), createMemoryDto("제주도 여행", "즐거운 여행", null));
        Memory memory = memoryRepository.findAllByMemberId(member.getId(), SortType.DATE_DESC, null).get(0);

        memoryService.leftMemory(memory.getId(), member.getId());

        List<Memory> memories = memoryService.findMemoryList(member.getId(), SortType.DATE_DESC, null);
        assertThat(memories).isEmpty();
    }

    @Test
    @DisplayName("참가하지 않은 추억 탈퇴 시 BusinessException 발생")
    void leftMemory_미참가_예외발생() {
        memoryService.createMemory(member.getId(), createMemoryDto("제주도 여행", "즐거운 여행", null));
        Memory memory = memoryRepository.findAllByMemberId(member.getId(), SortType.DATE_DESC, null).get(0);

        assertThatThrownBy(() -> memoryService.leftMemory(memory.getId(), otherMember.getId()))
                .isInstanceOf(BusinessException.class)
                .hasMessage(ErrorCode.MEMBER_MEMORY_NOT_FOUND.getMessage());
    }

    // ===== findOne =====

    @Test
    @DisplayName("MemberMemory 조회 성공")
    void findOne_성공() {
        memoryService.createMemory(member.getId(), createMemoryDto("제주도 여행", "즐거운 여행", null));
        Memory memory = memoryRepository.findAllByMemberId(member.getId(), SortType.DATE_DESC, null).get(0);

        MemberMemory memberMemory = memoryService.findOne(memory.getId(), member.getId());

        assertThat(memberMemory).isNotNull();
        assertThat(memberMemory.getMember().getId()).isEqualTo(member.getId());
    }

    @Test
    @DisplayName("참가하지 않은 멤버 조회 시 BusinessException 발생")
    void findOne_미참가_예외발생() {
        memoryService.createMemory(member.getId(), createMemoryDto("제주도 여행", "즐거운 여행", null));
        Memory memory = memoryRepository.findAllByMemberId(member.getId(), SortType.DATE_DESC, null).get(0);

        assertThatThrownBy(() -> memoryService.findOne(memory.getId(), otherMember.getId()))
                .isInstanceOf(BusinessException.class)
                .hasMessage(ErrorCode.MEMBER_MEMORY_NOT_FOUND.getMessage());
    }

    // ===== updateMemoryPhoto =====

    @Test
    @DisplayName("표지 사진 수정 성공 - 기존 softDelete 후 새 INSERT")
    void updateMemoryPhoto_성공() {
        memoryService.createMemory(member.getId(), createMemoryDto("제주도 여행", "즐거운 여행", "http://old.img/1"));
        Memory memory = memoryRepository.findAllByMemberId(member.getId(), SortType.DATE_DESC, null).get(0);

        memoryService.updateMemoryPhoto(memory.getId(), member.getId(), "http://new.img/1");

        MemoryPhoto photo = mpRepository.findOne(memory.getId()).get();
        assertThat(photo.getImageUrl()).isEqualTo("http://new.img/1");
        assertThat(photo.getMember().getId()).isEqualTo(member.getId());
    }

    @Test
    @DisplayName("표지 사진 수정 시 기존 사진 softDelete 됨")
    void updateMemoryPhoto_기존사진_softDelete() {
        memoryService.createMemory(member.getId(), createMemoryDto("제주도 여행", "즐거운 여행", "http://old.img/1"));
        Memory memory = memoryRepository.findAllByMemberId(member.getId(), SortType.DATE_DESC, null).get(0);
        MemoryPhoto oldPhoto = mpRepository.findOne(memory.getId()).get();

        memoryService.updateMemoryPhoto(memory.getId(), member.getId(), "http://new.img/1");

        assertThat(oldPhoto.getDeletedAt()).isNotNull();
    }

    @Test
    @DisplayName("참가하지 않은 멤버가 사진 수정 시 BusinessException 발생")
    void updateMemoryPhoto_권한없음_예외발생() {
        memoryService.createMemory(member.getId(), createMemoryDto("제주도 여행", "즐거운 여행", "http://old.img/1"));
        Memory memory = memoryRepository.findAllByMemberId(member.getId(), SortType.DATE_DESC, null).get(0);

        assertThatThrownBy(() -> memoryService.updateMemoryPhoto(memory.getId(), otherMember.getId(), "http://new.img/1"))
                .isInstanceOf(BusinessException.class)
                .hasMessage(ErrorCode.MEMBER_MEMORY_NOT_FOUND.getMessage());
    }

    // ===== deleteMemoryPhoto =====

    @Test
    @DisplayName("표지 사진 삭제 성공 - deletedAt 세팅")
    void deleteMemoryPhoto_성공() {
        memoryService.createMemory(member.getId(), createMemoryDto("제주도 여행", "즐거운 여행", "http://photo.img/1"));
        Memory memory = memoryRepository.findAllByMemberId(member.getId(), SortType.DATE_DESC, null).get(0);

        memoryService.deleteMemoryPhoto(memory.getId(), member.getId());

        assertThat(mpRepository.findOne(memory.getId())).isEmpty();
    }

    @Test
    @DisplayName("사진 없는 추억 삭제 시 BusinessException 발생")
    void deleteMemoryPhoto_사진없음_예외발생() {
        memoryService.createMemory(member.getId(), createMemoryDto("제주도 여행", "즐거운 여행", null));
        Memory memory = memoryRepository.findAllByMemberId(member.getId(), SortType.DATE_DESC, null).get(0);

        assertThatThrownBy(() -> memoryService.deleteMemoryPhoto(memory.getId(), member.getId()))
                .isInstanceOf(BusinessException.class)
                .hasMessage(ErrorCode.MEMORY_PHOTO_NOT_FOUND.getMessage());
    }

    @Test
    @DisplayName("참가하지 않은 멤버가 사진 삭제 시 BusinessException 발생")
    void deleteMemoryPhoto_권한없음_예외발생() {
        memoryService.createMemory(member.getId(), createMemoryDto("제주도 여행", "즐거운 여행", "http://photo.img/1"));
        Memory memory = memoryRepository.findAllByMemberId(member.getId(), SortType.DATE_DESC, null).get(0);

        assertThatThrownBy(() -> memoryService.deleteMemoryPhoto(memory.getId(), otherMember.getId()))
                .isInstanceOf(BusinessException.class)
                .hasMessage(ErrorCode.MEMBER_MEMORY_NOT_FOUND.getMessage());
    }

    // ===== 헬퍼 메서드 =====

    private CreateMemoryRequestDTO createMemoryDto(String name, String description, String photoUrl) {
        return new CreateMemoryRequestDTO(name, description, 0, photoUrl,
                LocalDate.of(2026, 5, 1), LocalDate.of(2026, 5, 5));
    }

    private UpdateMemoryRequestDTO updateMemoryDto(String name, String description) {
        return new UpdateMemoryRequestDTO(name, description,
                LocalDate.of(2026, 5, 1), LocalDate.of(2026, 5, 5), true);
    }
}
