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
    private String description;
    private LocalDate startDate;
    private LocalDate endDate;

    public static MemoryDetailResponseDTO from(Memory memory) {
        return new MemoryDetailResponseDTO(
                memory.getId(),
                memory.getName(),
                memory.getAvgRating(),
                memory.getPlaceCount(),
                memory.getDescription(),
                memory.getStartDate(),
                memory.getEndDate()
        );
    }
}
