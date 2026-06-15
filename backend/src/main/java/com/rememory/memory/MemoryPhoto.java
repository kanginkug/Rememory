package com.rememory.memory;

import com.rememory.member.Member;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 추억 표지 사진 엔티티
 * - 추억당 1장
 * - 수정 시 기존 사진 softDelete 후 새로 INSERT (이력 보존)
 */
@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class MemoryPhoto {

    @Id
    @GeneratedValue
    @Column(name = "memory_photo_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "memory_id")
    private Memory memory;

    /** 사진 등록/수정한 멤버 */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "register_id")
    private Member member;

    private String imageUrl;

    private LocalDateTime createdAt;

    private LocalDateTime deletedAt;

    /**
     * 사진 생성 (정적 팩토리 메서드)
     * 수정 시에도 새 객체 생성 (softDelete + 새 INSERT)
     */
    public static MemoryPhoto create(Memory memory, Member member, String imageUrl) {
        MemoryPhoto memoryPhoto = new MemoryPhoto();
        memoryPhoto.memory = memory;
        memoryPhoto.member = member;
        memoryPhoto.imageUrl = imageUrl;
        return memoryPhoto;
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    /** 사진 삭제 (Soft Delete) */
    public void delete() {
        this.deletedAt = LocalDateTime.now();
    }
}
