package com.rememory.memory.dto;

import com.rememory.member.MemberInfoDTO;
import com.rememory.memory.Memory;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Getter
@AllArgsConstructor
public class MemoryDetailResponseDTO {

    private Long id;
    private String name;
    private BigDecimal avgRating;
    private Boolean showHistoryToNew;
    private int placeCount;
    private int memberCount;
    private Long creatorId;
    private List<MemberInfoDTO> memberInfoDTOList;
    private String description;
    private LocalDate startDate;
    private LocalDate endDate;
    private String imageUrl;

    public static MemoryDetailResponseDTO from(Memory memory, String imageUrl, List<MemberInfoDTO> memberInfoDTOList) {
        return new MemoryDetailResponseDTO(
                memory.getId(),
                memory.getName(),
                memory.getAvgRating(),
                memory.getShowHistoryToNew(),
                memory.getPlaceCount(),
                memory.getMemberCount(),
                memory.getCreator().getId(),
                memberInfoDTOList,
                memory.getDescription(),
                memory.getStartDate(),
                memory.getEndDate(),
                imageUrl
        );
    }
}
