package com.rememory.invitation;

import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/invitation")
@RequiredArgsConstructor
public class InvitationController {
    private final InvitationService invitationService;

    @PostMapping("/memory/{memoryId}")
    public ResponseEntity<Void> createInvitation(@RequestAttribute("memberId") Long memberId, @PathVariable Long memoryId, @RequestParam("invitedCnt") @Min(0) int invitedCnt) {
        invitationService.save(memoryId, memberId, invitedCnt);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @PostMapping("/agree/{agreeCode}")
    public ResponseEntity<Void> agreeInvitation(@RequestAttribute("memberId") Long memberId, @PathVariable String agreeCode) {
        invitationService.agreeInvite(memberId, agreeCode);
        return ResponseEntity.ok().build();
    }
}
