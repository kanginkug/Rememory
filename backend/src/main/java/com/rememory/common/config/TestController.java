package com.rememory.common.config;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 임시 테스트용 컨트롤러
 * 프론트 연동 후 삭제 예정
 */
@RestController
public class TestController {

    @GetMapping("/login/success")
    public String loginSuccess(@RequestParam String token) {
        return "로그인 성공! token: " + token;
    }

    @GetMapping("/login/failed")
    public String loginFailed(@RequestParam(required = false) String error) {
        return "로그인 실패! error: " + error;
    }
}
