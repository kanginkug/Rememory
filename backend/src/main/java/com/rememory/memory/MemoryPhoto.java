package com.rememory.memory;

import jakarta.persistence.*;
import lombok.Getter;

import java.time.LocalDateTime;

@Entity
@Getter
public class MemoryPhoto {

    @Id
    @GeneratedValue
    @Column(name = "memory_photo_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "memory_id")
    private Memory memory;

    private String imageUrl;

    private LocalDateTime createdAt;

    private LocalDateTime deletedAt;
}
