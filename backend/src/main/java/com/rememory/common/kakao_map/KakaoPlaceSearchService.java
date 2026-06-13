package com.rememory.common.kakao_map;

import com.rememory.place.PlaceSearchResponseDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import org.springframework.http.HttpHeaders;

import java.net.URI;
import java.util.List;

@Service
@RequiredArgsConstructor
public class KakaoPlaceSearchService {

    @Value("${kakao.rest-api-key}")
    private String kakaoRestApiKey;

    private final RestTemplate restTemplate;

    /** 카카오 키워드 장소 검색 API 호출 후 결과 반환 */
    public List<PlaceSearchResponseDTO> searchByKeyword(String query) {
        URI uri = UriComponentsBuilder
                .fromUriString("https://dapi.kakao.com/v2/local/search/keyword.json")
                .queryParam("query", query)
                .build()
                .encode()
                .toUri();

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "KakaoAK " + kakaoRestApiKey);

        ResponseEntity<KakaoSearchResponse> response = restTemplate.exchange(
                uri, HttpMethod.GET, new HttpEntity<>(headers), KakaoSearchResponse.class
        );

        if (response.getBody() == null) return List.of();
        List<KakaoPlaceDocument> documents = response.getBody().getDocuments();
        if (documents == null) return List.of();
        return documents.stream()
                .map(PlaceSearchResponseDTO::from)
                .toList();
    }
}
