package com.rememory.place;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Getter
@Valid
@AllArgsConstructor
public class CreatePlaceRequestDTO {

    @NotBlank
    private String name;

    @NotNull
    private Category category;

    private String address;

    private List<String> photoUrlList;

    private String kakaoPlaceId;

    private BigDecimal latitude;

    private BigDecimal longitude;

    private String regionDepth1;

    private String regionDepth2;

    private LocalDate visitedAt;
}
