package com.rememory.memory;

import com.rememory.member.Member;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Memory {

    @Id
    @GeneratedValue
    @Column(name = "memory_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "creator_id")
    private Member creator;

    private String name;

    private BigDecimal avgRating;

    private int placeCount;

    private int memberCount;

    // 신규 멤버에게 과거 공개 여부
    @Column(nullable = false)
    private Boolean showHistoryToNew = true;

    private String description;

    private LocalDate startDate;

    private LocalDate endDate;

    private LocalDateTime createdAt;

    private LocalDateTime deletedAt;

    /** 정적 팩토리: 신규 추억 생성, 초기 통계(avgRating=0, placeCount=0, memberCount=1) 설정 */
    public static Memory create(Member creator, String name, String description, LocalDate startDate, LocalDate endDate) {
        Memory memory = new Memory();
        memory.creator = creator;
        memory.name = name;
        memory.description = description;
        memory.startDate = startDate;
        memory.endDate = endDate;
        memory.avgRating = BigDecimal.ZERO;
        memory.placeCount = 0;
        memory.memberCount = 1;
        return memory;
    }

    /** 추억 기본 정보 수정 */
    public void update(String name, Boolean showHistoryToNew, String description, LocalDate startDate, LocalDate endDate){
        this.name = name;
        this.showHistoryToNew = showHistoryToNew;
        this.description = description;
        this.startDate = startDate;
        this.endDate = endDate;
    }

    /** MemoryRepository.recalculateRating()에서 전체 Place 집계 후 호출 */
    public void recalculateRating(BigDecimal avgRating, int placeCount){
        this.avgRating = avgRating;
        this.placeCount = placeCount;
    }

    /** 최초 저장 시 생성일 자동 세팅 */
    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    /** Soft delete: 추억 삭제 처리 */
    public void delete() {
        this.deletedAt = LocalDateTime.now();
    }

    /** 멤버 참여 시 카운트 증가 */
    public void plusMemberCount() {
        this.memberCount++;
    }

    /** 멤버 나가기 시 카운트 감소 */
    public void minusMemberCount() {
        this.memberCount--;
    }
}
