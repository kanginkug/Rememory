package com.rememory.place;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Valid
@AllArgsConstructor
public class UpdatePlaceRequestDTO {

    @NotBlank
    @Size(max = 30)
    private String name;

    @NotNull
    private Category category;

    private String address;

    private String detailAddress;

    @Size(max = 300)
    private String description;

    private String kakaoPlaceId;

    private String kakaoPlaceName;

    private BigDecimal latitude;

    private BigDecimal longitude;

    private String regionDepth1;

    private String regionDepth2;

    private LocalDate visitedAt;
}
