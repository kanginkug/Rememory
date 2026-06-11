package com.rememory.member;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@AllArgsConstructor
public class MemberStatsResponseDTO {
    private int memoryCount;
    private int placeCount;
    private BigDecimal reviewAvg;

    public static MemberStatsResponseDTO from(int memoryCount, int placeCount, BigDecimal reviewAvg) {
        return new MemberStatsResponseDTO(
                memoryCount, placeCount, reviewAvg
        );
    }
}
