package com.rememory.place;

import com.rememory.common.kakao_map.KakaoPlaceDocument;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@AllArgsConstructor
public class PlaceSearchResponseDTO {

    private String kakaoPlaceId;
    private String kakaoPlaceName;
    private String address;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private String regionDepth1;
    private String regionDepth2;

    public static PlaceSearchResponseDTO from(KakaoPlaceDocument doc) {
        String[] parts = doc.getAddressName() != null ? doc.getAddressName().split(" ") : new String[]{};
        String depth1 = parts.length > 0 ? parts[0] : "";
        String depth2 = parts.length > 1 ? parts[1] : "";

        return new PlaceSearchResponseDTO(
                doc.getId(),
                doc.getPlaceName(),
                doc.getAddressName(),
                new BigDecimal(doc.getY().isEmpty() ? "0" : doc.getY()),
                new BigDecimal(doc.getX().isEmpty() ? "0" : doc.getX()),
                depth1,
                depth2
        );
    }
}
