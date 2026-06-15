package com.rememory.place;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

@Getter
@AllArgsConstructor
public class CreatePlacePhotoRequestDTO {
    private List<String> photoUrlList;
}
