package com.rememory.place;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Valid
@AllArgsConstructor
public class CreatePlaceRequestDTO {

    @NotBlank
    private String name;

    @NotNull
    private Category category;

    private String address;

    private String kakaoPlaceId;

    private BigDecimal latitude;

    private BigDecimal longitude;

    private String region_depth1;

    private String region_depth2;

    private LocalDate visitedAt;
}
