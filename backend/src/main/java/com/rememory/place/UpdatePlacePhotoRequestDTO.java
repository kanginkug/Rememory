package com.rememory.place;

import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

@Getter
@AllArgsConstructor
public class UpdatePlacePhotoRequestDTO {
    @NotEmpty
    private List<Long> placePhotoIdList;

    @NotEmpty
    private List<String> photoUrlList;

}
