package com.rememory.place;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/place")
@RequiredArgsConstructor
public class PlaceController {
    private final PlaceService placeService;

    // 장소 등록 (사진 선택)
    @PostMapping(value = "{memoryId}")
    public ResponseEntity<Void> createPlace(@RequestAttribute("memberId") Long memberId, @PathVariable("memoryId") Long memoryId, @RequestBody @Valid CreatePlaceRequestDTO cpRequestDTO) {
        placeService.save(memoryId, memberId, cpRequestDTO);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    // 추억 내 전체 장소 목록 조회 (대표 사진 포함)
    @GetMapping("/{memoryId}")
    public ResponseEntity<List<PlaceDetailResponseDTO>> findAllByMemoryId(@RequestAttribute("memberId") Long memberId, @PathVariable("memoryId") Long memoryId) {
        return ResponseEntity.ok(placeService.findAllByMemoryId(memberId, memoryId));
    }

    // 내 베스트 장소 조회 (평점 높은 순)
    @GetMapping("/best")
    public ResponseEntity<List<PlaceDetailResponseDTO>> findBestPlace(@RequestAttribute("memberId") Long memberId) {
        return ResponseEntity.ok(placeService.findBestPlace(memberId));
    }

    // 카테고리·지역 필터 조회
    @GetMapping("/{memoryId}/sort")
    public ResponseEntity<List<PlaceDetailResponseDTO>> sortPlaceByType(@RequestAttribute("memberId") Long memberId,
                                                                        @PathVariable("memoryId") Long memoryId,
                                                                         @RequestParam("category") Category category,
                                                                        @RequestParam("regionDepth1") String regionDepth1,
                                                                        @RequestParam("regionDepth2") String regionDepth2) {
        return ResponseEntity.ok(placeService.sortPlaceByType(memberId, memoryId, category, regionDepth1, regionDepth2));
    }

    // 장소명 검색
    @GetMapping("/{memoryId}/search")
    public ResponseEntity<List<PlaceDetailResponseDTO>> searchByPlaceName(@RequestAttribute("memberId") Long memberId, @PathVariable("memoryId") Long memoryId, @RequestParam String name) {
        return ResponseEntity.ok(placeService.searchByName(memberId, memoryId, name));
    }

    // 장소 상세 조회 (전체 사진 포함)
    @GetMapping("/{memoryId}/place/{placeId}")
    public ResponseEntity<PlaceDetailResponseDTO> detailPlace(@RequestAttribute("memberId") Long memberId, @PathVariable("memoryId") Long memoryId, @PathVariable("placeId") Long placeId) {
        return ResponseEntity.ok(placeService.detailPlace(memberId, memoryId, placeId));
    }

    // 장소 삭제 (리뷰 있으면 불가)
    @DeleteMapping("/{memoryId}/place/{placeId}")
    public ResponseEntity<Void> deletePlace(@RequestAttribute("memberId") Long memberId, @PathVariable("memoryId") Long memoryId, @PathVariable("placeId") Long placeId) {
        placeService.deletePlace(memoryId, memberId, placeId);
        return ResponseEntity.noContent().build();
    }

    // 장소 정보 수정
    @PutMapping("/{memoryId}/place/{placeId}")
    public ResponseEntity<Void> updatePlace(@RequestAttribute("memberId") Long memberId, @PathVariable("memoryId") Long memoryId, @PathVariable("placeId") Long placeId, @RequestBody @Valid UpdatePlaceRequestDTO upReuqestDTO) {
        placeService.updatePlace(memoryId, memberId, placeId, upReuqestDTO);
        return ResponseEntity.noContent().build();
    }

    // 장소 사진 추가 (최대 5장)
    @PostMapping(value = "/{memoryId}/place/{placeId}/photo")
    public ResponseEntity<Void> savePlacePhoto(@RequestAttribute("memberId") Long memberId, @PathVariable("memoryId") Long memoryId, @PathVariable("placeId") Long placeId, @RequestBody @Valid CreatePlacePhotoRequestDTO createPlacePhotoRequestDTO) {
        placeService.savePlacePhoto(memoryId, memberId, placeId, createPlacePhotoRequestDTO.getPhotoUrlList());
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    // 장소 사진 삭제 (본인만 가능)
    @DeleteMapping("/{memoryId}/place/{placeId}/photo")
    public ResponseEntity<Void> deletePlacePhoto(@RequestAttribute("memberId") Long memberId, @PathVariable("memoryId") Long memoryId, @PathVariable("placeId") Long placeId,
                                                 @RequestBody @Valid DeletePlacePhotoRequestDTO deletePlacePhotoRequestDTO) {
        placeService.deletePlacePhoto(memoryId, memberId, placeId, deletePlacePhotoRequestDTO);
        return ResponseEntity.noContent().build();
    }
}
