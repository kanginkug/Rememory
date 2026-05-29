package com.rememory.memory.dto;

import com.rememory.memory.Memory;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@AllArgsConstructor
public class MemoryDetailResponseDTO {

    private Long id;
    private String name;
    private BigDecimal avgRating;
    private int placeCount;
    private int memberCount;
    private String description;
    private LocalDate startDate;
    private LocalDate endDate;
    private String imageUrl;

    public static MemoryDetailResponseDTO from(Memory memory, String imageUrl) {
        return new MemoryDetailResponseDTO(
                memory.getId(),
                memory.getName(),
                memory.getAvgRating(),
                memory.getPlaceCount(),
                memory.getMemberCount(),
                memory.getDescription(),
                memory.getStartDate(),
                memory.getEndDate(),
                imageUrl
        );
    }
}
