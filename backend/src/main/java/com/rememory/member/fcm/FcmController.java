package com.rememory.member.fcm;

import com.rememory.member.FcmTokenRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/fcm")
@RequiredArgsConstructor
public class FcmController {

    private final FcmService fcmService;

    @PostMapping("/token")
    public ResponseEntity<Void> updateFcmToken(@RequestAttribute("memberId") Long memberId, @RequestBody FcmTokenRequest request) {
            fcmService.updateFcmToken(memberId, request.fcmToken());
            return ResponseEntity.ok().build();
    }
}
