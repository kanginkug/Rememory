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

    @OneToMany
    private Long memoryId;

    private String imageUrl;

    private LocalDateTime createdAt;

    private LocalDateTime deletedAt;
}
