package com.rememory.place;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/place")
@RequiredArgsConstructor
public class PlaceController {
    private final PlaceService placeService;

    @PostMapping(value = "{memoryId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Void> createPlace(@RequestAttribute("memberId") Long memberId, @PathVariable("memoryId") Long memoryId, @RequestPart("data") CreatePlaceRequestDTO cpRequestDTO,
                                            @RequestPart(value = "file", required = false) MultipartFile file) {
        placeService.save(memoryId, memberId, cpRequestDTO, file);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @GetMapping("/{memoryId}")
    public ResponseEntity<List<PlaceDetailResponseDTO>> findAllByMemoryId(@RequestAttribute("memberId") Long memberId, @PathVariable("memoryId") Long memoryId) {
        return ResponseEntity.ok(placeService.findAllByMemoryId(memberId, memoryId));
    }

    @GetMapping("/{memoryId}/sort")
    public ResponseEntity<List<PlaceDetailResponseDTO>> sortPlaceByType(@RequestAttribute("memberId") Long memberId,
                                                                        @PathVariable("memoryId") Long memoryId,
                                                                         @RequestParam("category") Category category,
                                                                        @RequestParam("regionDepth1") String regionDepth1,
                                                                        @RequestParam("regionDepth2") String regionDepth2) {
        return ResponseEntity.ok(placeService.sortPlaceByType(memberId, memoryId, category, regionDepth1, regionDepth2));
    }

    @GetMapping("/{memoryId}/search")
    public ResponseEntity<List<PlaceDetailResponseDTO>> searchByPlaceName(@RequestAttribute("memberId") Long memberId, @PathVariable("memoryId") Long memoryId, @RequestParam String name) {
        return ResponseEntity.ok(placeService.searchByName(memberId, memoryId, name));
    }

    @GetMapping("/{memoryId}/place/{placeId}")
    public ResponseEntity<PlaceDetailResponseDTO> detailPlace(@RequestAttribute("memberId") Long memberId, @PathVariable("memoryId") Long memoryId, @PathVariable("placeId") Long placeId) {
        return ResponseEntity.ok(placeService.detailPlace(memberId, memoryId, placeId));
    }

    @DeleteMapping("/{memoryId}/place/{placeId}")
    public ResponseEntity<Void> deletePlace(@RequestAttribute("memberId") Long memberId, @PathVariable("memoryId") Long memoryId, @PathVariable("placeId") Long placeId) {
        placeService.deletePlace(memoryId, memberId, placeId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{memoryId}/place/{placeId}")
    public ResponseEntity<Void> updatePlace(@RequestAttribute("memberId") Long memberId, @PathVariable("memoryId") Long memoryId, @PathVariable("placeId") Long placeId, @RequestBody @Valid UpdatePlaceRequestDTO upReuqestDTO) {
        placeService.updatePlace(memoryId, memberId, placeId, upReuqestDTO);
        return ResponseEntity.noContent().build();
    }

    @PostMapping(value = "/{memoryId}/place/{placeId}/photo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Void> savePlacePhoto(@RequestAttribute("memberId") Long memberId, @PathVariable("memoryId") Long memoryId, @PathVariable("placeId") Long placeId, @RequestPart(value = "file", required = false) MultipartFile file) {
        placeService.savePlacePhoto(memoryId, memberId, placeId, file);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @DeleteMapping("/{memoryId}/place/{placeId}/photo/{placePhotoId}")
    public ResponseEntity<Void> deletePlacePhoto(@RequestAttribute("memberId") Long memberId, @PathVariable("memoryId") Long memoryId, @PathVariable("placeId") Long placeId,
                                                 @PathVariable("placePhotoId") Long placePhotoId) {
        placeService.deletePlacePhoto(memoryId, memberId, placeId, placePhotoId);
        return ResponseEntity.noContent().build();
    }


}
