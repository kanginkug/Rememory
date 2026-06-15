package com.rememory.place;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

@Getter
@AllArgsConstructor
public class DeletePlacePhotoRequestDTO {
    private List<Long> placePhotoIdList;
}
