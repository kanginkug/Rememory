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

    @Autowired
    MemoryService memoryService;

    @Autowired
    MemoryRepository memoryRepository;

    @Autowired
    MemberRepository memberRepository;

    // ===== 테스트 데이터 =====
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
        // given
        CreateMemoryRequestDTO dto = createMemoryDto("제주도 여행", "즐거운 여행");

        // when
        memoryService.createMemory(member.getId(), dto);

        // then
        List<Memory> memories = memoryRepository.findAllByMemberId(member.getId(), SortType.DATE_DESC, null);
        assertThat(memories).hasSize(1);
        assertThat(memories.get(0).getName()).isEqualTo("제주도 여행");
    }

    @Test
    @DisplayName("추억 생성 시 createdAt 자동 세팅")
    void createMemory_createdAt_자동세팅() {
        // given
        CreateMemoryRequestDTO dto = createMemoryDto("제주도 여행", "즐거운 여행");

        // when
        memoryService.createMemory(member.getId(), dto);

        // then
        List<Memory> memories = memoryRepository.findAllByMemberId(member.getId(), SortType.DATE_DESC, null);
        assertThat(memories.get(0).getCreatedAt()).isNotNull();
    }

    @Test
    @DisplayName("없는 멤버로 추억 생성 시 BusinessException 발생")
    void createMemory_없는멤버_예외발생() {
        // given
        CreateMemoryRequestDTO dto = createMemoryDto("제주도 여행", "즐거운 여행");

        // when & then
        assertThatThrownBy(() -> memoryService.createMemory(999999L, dto))
                .isInstanceOf(BusinessException.class)
                .hasMessage(ErrorCode.MEMBER_NOT_FOUND.getMessage());
    }

    // ===== updateMemory =====

    @Test
    @DisplayName("추억 수정 성공")
    void updateMemory_성공() {
        // given
        memoryService.createMemory(member.getId(), createMemoryDto("제주도 여행", "즐거운 여행"));
        Memory memory = memoryRepository.findAllByMemberId(member.getId(), SortType.DATE_DESC, null).get(0);

        // when
        UpdateMemoryRequestDTO updateDto = updateMemoryDto("부산 여행", "맛있는 여행");
        memoryService.updateMemory(member.getId(), memory.getId(), updateDto);

        // then
        Memory updated = memoryRepository.findOne(memory.getId()).get();
        assertThat(updated.getName()).isEqualTo("부산 여행");
        assertThat(updated.getDescription()).isEqualTo("맛있는 여행");
    }

    @Test
    @DisplayName("creator가 아닌 멤버가 수정 시 BusinessException 발생")
    void updateMemory_권한없음_예외발생() {
        // given
        memoryService.createMemory(member.getId(), createMemoryDto("제주도 여행", "즐거운 여행"));
        Memory memory = memoryRepository.findAllByMemberId(member.getId(), SortType.DATE_DESC, null).get(0);

        // when & then
        UpdateMemoryRequestDTO updateDto = updateMemoryDto("부산 여행", "맛있는 여행");
        assertThatThrownBy(() -> memoryService.updateMemory(otherMember.getId(), memory.getId(), updateDto))
                .isInstanceOf(BusinessException.class)
                .hasMessage(ErrorCode.MEMORY_NOT_CREATOR.getMessage());
    }

    @Test
    @DisplayName("없는 추억 수정 시 BusinessException 발생")
    void updateMemory_없는추억_예외발생() {
        // when & then
        UpdateMemoryRequestDTO updateDto = updateMemoryDto("부산 여행", "맛있는 여행");
        assertThatThrownBy(() -> memoryService.updateMemory(member.getId(), 999999L, updateDto))
                .isInstanceOf(BusinessException.class)
                .hasMessage(ErrorCode.MEMORY_NOT_FOUND.getMessage());
    }

    // ===== findMemoryList =====

    @Test
    @DisplayName("내 추억 목록 조회 - 최신순")
    void findMemoryList_최신순() {
        // given
        memoryService.createMemory(member.getId(), createMemoryDto("첫번째 여행", "설명1"));
        memoryService.createMemory(member.getId(), createMemoryDto("두번째 여행", "설명2"));

        // when
        List<Memory> memories = memoryService.findMemoryList(member.getId(), SortType.DATE_DESC, null);

        // then
        assertThat(memories).hasSize(2);
        assertThat(memories.get(0).getName()).isEqualTo("두번째 여행");
    }

    @Test
    @DisplayName("내 추억 목록 조회 - 키워드 검색")
    void findMemoryList_키워드검색() {
        // given
        memoryService.createMemory(member.getId(), createMemoryDto("제주도 여행", "설명1"));
        memoryService.createMemory(member.getId(), createMemoryDto("부산 여행", "설명2"));
        memoryService.createMemory(member.getId(), createMemoryDto("서울 나들이", "설명3"));

        // when
        List<Memory> memories = memoryService.findMemoryList(member.getId(), SortType.DATE_DESC, "여행");

        // then
        assertThat(memories).hasSize(2);
    }

    @Test
    @DisplayName("다른 멤버의 추억은 조회 안 됨")
    void findMemoryList_다른멤버_추억_미조회() {
        // given
        memoryService.createMemory(member.getId(), createMemoryDto("제주도 여행", "설명1"));
        memoryService.createMemory(otherMember.getId(), createMemoryDto("부산 여행", "설명2"));

        // when
        List<Memory> memories = memoryService.findMemoryList(member.getId(), SortType.DATE_DESC, null);

        // then
        assertThat(memories).hasSize(1);
        assertThat(memories.get(0).getName()).isEqualTo("제주도 여행");
    }

    // ===== deleteMemory =====

    @Test
    @DisplayName("추억 삭제 성공 - deletedAt 세팅")
    void deleteMemory_성공() {
        // given
        memoryService.createMemory(member.getId(), createMemoryDto("제주도 여행", "즐거운 여행"));
        Memory memory = memoryRepository.findAllByMemberId(member.getId(), SortType.DATE_DESC, null).get(0);

        // when
        memoryService.deleteMemory(member.getId(), memory.getId());

        // then
        Memory deleted = memoryRepository.findOne(memory.getId()).get();
        assertThat(deleted.getDeletedAt()).isNotNull();
    }

    @Test
    @DisplayName("creator가 아닌 멤버가 삭제 시 BusinessException 발생")
    void deleteMemory_권한없음_예외발생() {
        // given
        memoryService.createMemory(member.getId(), createMemoryDto("제주도 여행", "즐거운 여행"));
        Memory memory = memoryRepository.findAllByMemberId(member.getId(), SortType.DATE_DESC, null).get(0);

        // when & then
        assertThatThrownBy(() -> memoryService.deleteMemory(otherMember.getId(), memory.getId()))
                .isInstanceOf(BusinessException.class)
                .hasMessage(ErrorCode.MEMORY_NOT_CREATOR.getMessage());
    }

    @Test
    @DisplayName("삭제된 추억은 목록에서 조회 안 됨")
    void deleteMemory_삭제후_목록미조회() {
        // given
        memoryService.createMemory(member.getId(), createMemoryDto("제주도 여행", "즐거운 여행"));
        Memory memory = memoryRepository.findAllByMemberId(member.getId(), SortType.DATE_DESC, null).get(0);

        // when
        memoryService.deleteMemory(member.getId(), memory.getId());

        // then
        List<Memory> memories = memoryService.findMemoryList(member.getId(), SortType.DATE_DESC, null);
        assertThat(memories).isEmpty();
    }

    // ===== 헬퍼 메서드 =====

    private CreateMemoryRequestDTO createMemoryDto(String name, String description) {
        return new CreateMemoryRequestDTO(
                name,
                description,
                LocalDate.of(2026, 5, 1),
                LocalDate.of(2026, 5, 5)
        );
    }

    private UpdateMemoryRequestDTO updateMemoryDto(String name, String description) {
        return new UpdateMemoryRequestDTO(
                name,
                description,
                LocalDate.of(2026, 5, 1),
                LocalDate.of(2026, 5, 5),
                true
        );
    }
}
