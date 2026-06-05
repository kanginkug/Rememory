package com.rememory.invitation;

import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/invitation")
@Validated
@RequiredArgsConstructor
public class InvitationController {
    private final InvitationService invitationService;

    @PostMapping("/memory/{memoryId}")
    public ResponseEntity<InvitationResponseDTO> createInvitation(@RequestAttribute("memberId") Long memberId, @PathVariable Long memoryId) {
        return ResponseEntity.ok(InvitationResponseDTO.from(invitationService.save(memoryId, memberId)));
    }

    @PostMapping("/agree/{agreeCode}")
    public ResponseEntity<Void> agreeInvitation(@RequestAttribute("memberId") Long memberId, @PathVariable String agreeCode) {
        invitationService.agreeInvite(memberId, agreeCode);
        return ResponseEntity.ok().build();
    }
}
