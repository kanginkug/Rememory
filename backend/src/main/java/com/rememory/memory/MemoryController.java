package com.rememory.memory;

import com.rememory.memory.dto.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/memory")
@RequiredArgsConstructor
public class MemoryController {
    private final MemoryService memoryService;

    /** POST /api/memory - 추억 생성 */
    @PostMapping
    public ResponseEntity<Void> createMemory(
            @RequestAttribute("memberId") Long memberId,
            @RequestBody @Valid CreateMemoryRequestDTO cmRequestDTO
    ) {
        memoryService.createMemory(memberId, cmRequestDTO);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    /** PUT /api/memory/{memoryId} - 추억 수정 */
    @PutMapping("/{memoryId}")
    public ResponseEntity<Void> updateMemory(@RequestAttribute("memberId") Long memberId, @PathVariable("memoryId") Long memoryId, @RequestBody @Valid UpdateMemoryRequestDTO umRequestDTO) {
        memoryService.updateMemory(memberId, memoryId, umRequestDTO);
        return ResponseEntity.ok().build();
    }

    /** DELETE /api/memory/{memoryId} - 추억 삭제 */
    @DeleteMapping("/{memoryId}")
    public ResponseEntity<Void> deleteMemory(@RequestAttribute("memberId") Long memberId, @PathVariable("memoryId") Long memoryId) {
        memoryService.deleteMemory(memoryId, memberId);
        return ResponseEntity.noContent().build();
    }

    /** GET /api/memory/{memoryId} - 추억 상세 조회 */
    @GetMapping("/{memoryId}")
    public ResponseEntity<MemoryDetailResponseDTO> findMemory(@RequestAttribute("memberId") Long memberId, @PathVariable("memoryId") Long memoryId) {
        return ResponseEntity.ok(memoryService.findMemory(memberId, memoryId));
    }

    /** GET /api/memory - 내 추억 목록 */
    @GetMapping
    public ResponseEntity<List<MemoryListResponseDTO>> findMemoryList(@RequestAttribute("memberId") Long memberId, @RequestParam("sortType") SortTypeMemory sortTypeMemory,
                                                                      @RequestParam(value = "keyword", required = false) String keyword) {
        return ResponseEntity.ok(memoryService.findMemoryList(memberId, sortTypeMemory, keyword));
    }

    /** DELETE /api/memory/{memoryId}/left - 추억 나가기 */
    @DeleteMapping("/{memoryId}/left")
    public ResponseEntity<Void> leftMemory(@RequestAttribute("memberId") Long memberId, @PathVariable("memoryId") Long memoryId) {
        memoryService.leftMemory(memoryId, memberId);
        return ResponseEntity.noContent().build();
    }

    /** POST /api/memory/{memoryId}/photo - 추억 표지 사진 등록 */
    @PostMapping("/{memoryId}/photo")
    public ResponseEntity<Void> saveMemoryPhoto(
            @RequestAttribute("memberId") Long memberId,
            @PathVariable("memoryId") Long memoryId,
            @RequestBody @Valid MemoryPhotoRequestDTO memoryPhotoRequestDTO
    ) {
        memoryService.saveMemoryPhoto(memoryPhotoRequestDTO, memoryId, memberId);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    /** DELETE /api/memory/{memoryId}/photo - 추억 표지 사진 삭제 */
    @DeleteMapping("/{memoryId}/photo")
    public ResponseEntity<Void> deleteMemoryPhoto(@RequestAttribute("memberId") Long memberId, @PathVariable("memoryId") Long memoryId) {
        memoryService.deleteMemoryPhoto(memoryId, memberId);
        return ResponseEntity.noContent().build();
    }

}
