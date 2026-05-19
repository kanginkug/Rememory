package com.rememory.place;

import com.rememory.common.exception.BusinessException;
import com.rememory.common.exception.ErrorCode;
import com.rememory.member.Member;
import com.rememory.member.MemberRepository;
import com.rememory.memory.MemberMemory;
import com.rememory.memory.MemberMemoryRepository;
import com.rememory.memory.Memory;
import com.rememory.memory.MemoryRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.*;

@SpringBootTest
@Transactional
class PlaceServiceTest {

    @Autowired PlaceService placeService;
    @Autowired PlaceRepository placeRepository;
    @Autowired PlacePhotoRepository ppRepository;
    @Autowired MemberRepository memberRepository;
    @Autowired MemoryRepository memoryRepository;
    @Autowired MemberMemoryRepository mmRepository;

    private Member member;
    private Member otherMember;
    private Memory memory;

    @BeforeEach
    void setUp() {
        member = Member.create("홍길동", "hong@gmail.com", "KAKAO", "kakao_111", "http://img/1");
        memberRepository.save(member);

        otherMember = Member.create("김철수", "kim@gmail.com", "KAKAO", "kakao_222", "http://img/2");
        memberRepository.save(otherMember);

        memory = Memory.create(member, "제주도 여행", "즐거운 여행",
                LocalDate.of(2026, 5, 1), LocalDate.of(2026, 5, 5));
        memoryRepository.save(memory);

        MemberMemory memberMemory = MemberMemory.create(member, memory);
        mmRepository.save(memberMemory);
    }

    // ===== save =====

    @Test
    @DisplayName("장소 등록 성공")
    void save_성공() {
        placeService.save(memory.getId(), member.getId(), createPlaceDto("흑돼지 맛집", Category.RESTAURANT));

        List<Place> places = placeRepository.findAllByMemoryId(memory.getId());
        assertThat(places).hasSize(1);
        assertThat(places.get(0).getName()).isEqualTo("흑돼지 맛집");
    }

    @Test
    @DisplayName("장소 등록 시 createdAt 자동 세팅")
    void save_createdAt_자동세팅() {
        placeService.save(memory.getId(), member.getId(), createPlaceDto("흑돼지 맛집", Category.RESTAURANT));

        List<Place> places = placeRepository.findAllByMemoryId(memory.getId());
        assertThat(places.get(0).getCreatedAt()).isNotNull();
    }

    @Test
    @DisplayName("추억 멤버가 아닌 사람이 장소 등록 시 BusinessException 발생")
    void save_비멤버_예외발생() {
        assertThatThrownBy(() -> placeService.save(memory.getId(), otherMember.getId(), createPlaceDto("흑돼지 맛집", Category.RESTAURANT)))
                .isInstanceOf(BusinessException.class)
                .hasMessage(ErrorCode.MEMBER_MEMORY_NOT_FOUND.getMessage());
    }

    @Test
    @DisplayName("없는 멤버로 장소 등록 시 BusinessException 발생")
    void save_없는멤버_예외발생() {
        assertThatThrownBy(() -> placeService.save(memory.getId(), 999999L, createPlaceDto("흑돼지 맛집", Category.RESTAURANT)))
                .isInstanceOf(BusinessException.class)
                .hasMessage(ErrorCode.MEMBER_NOT_FOUND.getMessage());
    }

    @Test
    @DisplayName("없는 추억에 장소 등록 시 BusinessException 발생")
    void save_없는추억_예외발생() {
        assertThatThrownBy(() -> placeService.save(999999L, member.getId(), createPlaceDto("흑돼지 맛집", Category.RESTAURANT)))
                .isInstanceOf(BusinessException.class)
                .hasMessage(ErrorCode.MEMORY_NOT_FOUND.getMessage());
    }

    // ===== findAll =====

    @Test
    @DisplayName("장소 목록 조회 성공")
    void findAll_성공() {
        placeService.save(memory.getId(), member.getId(), createPlaceDto("흑돼지 맛집", Category.RESTAURANT));
        placeService.save(memory.getId(), member.getId(), createPlaceDto("제주 호텔", Category.ACCOMMODATION));

        List<Place> places = placeService.findAll(memory.getId());
        assertThat(places).hasSize(2);
    }

    @Test
    @DisplayName("삭제된 장소는 목록에서 조회 안 됨")
    void findAll_삭제된_장소_미조회() {
        placeService.save(memory.getId(), member.getId(), createPlaceDto("흑돼지 맛집", Category.RESTAURANT));
        Place place = placeRepository.findAllByMemoryId(memory.getId()).get(0);

        placeService.deletePlace(memory.getId(), member.getId(), place.getId());

        List<Place> places = placeService.findAll(memory.getId());
        assertThat(places).isEmpty();
    }

    // ===== sortPlaceByType =====

    @Test
    @DisplayName("카테고리별 조회 성공")
    void sortPlaceByType_카테고리() {
        placeService.save(memory.getId(), member.getId(), createPlaceDto("흑돼지 맛집", Category.RESTAURANT));
        placeService.save(memory.getId(), member.getId(), createPlaceDto("제주 호텔", Category.ACCOMMODATION));
        placeService.save(memory.getId(), member.getId(), createPlaceDto("성산 일출봉", Category.ATTRACTION));

        List<Place> places = placeService.sortPlaceByType(memory.getId(), Category.RESTAURANT, null, null);
        assertThat(places).hasSize(1);
        assertThat(places.get(0).getName()).isEqualTo("흑돼지 맛집");
    }

    @Test
    @DisplayName("지역별 조회 성공")
    void sortPlaceByType_지역() {
        placeService.save(memory.getId(), member.getId(), createPlaceDto("흑돼지 맛집", Category.RESTAURANT, "제주", "제주시"));
        placeService.save(memory.getId(), member.getId(), createPlaceDto("중문 리조트", Category.ACCOMMODATION, "제주", "서귀포시"));

        List<Place> places = placeService.sortPlaceByType(memory.getId(), null, "제주", "제주시");
        assertThat(places).hasSize(1);
        assertThat(places.get(0).getName()).isEqualTo("흑돼지 맛집");
    }

    @Test
    @DisplayName("카테고리 + 지역 동시 조회 성공")
    void sortPlaceByType_카테고리_지역_동시() {
        placeService.save(memory.getId(), member.getId(), createPlaceDto("흑돼지 맛집", Category.RESTAURANT, "제주", "제주시"));
        placeService.save(memory.getId(), member.getId(), createPlaceDto("제주 식당", Category.RESTAURANT, "제주", "서귀포시"));

        List<Place> places = placeService.sortPlaceByType(memory.getId(), Category.RESTAURANT, "제주", "제주시");
        assertThat(places).hasSize(1);
        assertThat(places.get(0).getName()).isEqualTo("흑돼지 맛집");
    }

    // ===== searchByName =====

    @Test
    @DisplayName("장소명 검색 성공")
    void searchByName_성공() {
        placeService.save(memory.getId(), member.getId(), createPlaceDto("흑돼지 맛집", Category.RESTAURANT));
        placeService.save(memory.getId(), member.getId(), createPlaceDto("제주 호텔", Category.ACCOMMODATION));
        placeService.save(memory.getId(), member.getId(), createPlaceDto("성산 일출봉", Category.ATTRACTION));

        List<Place> places = placeService.searchByName(memory.getId(), "제주");
        assertThat(places).hasSize(1);
        assertThat(places.get(0).getName()).isEqualTo("제주 호텔");
    }

    // ===== updatePlace =====

    @Test
    @DisplayName("장소 수정 성공")
    void updatePlace_성공() {
        placeService.save(memory.getId(), member.getId(), createPlaceDto("흑돼지 맛집", Category.RESTAURANT));
        Place place = placeRepository.findAllByMemoryId(memory.getId()).get(0);

        placeService.updatePlace(memory.getId(), member.getId(), place.getId(),
                updatePlaceDto("고기국수 맛집", Category.RESTAURANT));

        Place updated = placeRepository.findOne(memory.getId(), place.getId()).get();
        assertThat(updated.getName()).isEqualTo("고기국수 맛집");
    }

    @Test
    @DisplayName("추억 멤버가 아닌 사람이 수정 시 BusinessException 발생")
    void updatePlace_비멤버_예외발생() {
        placeService.save(memory.getId(), member.getId(), createPlaceDto("흑돼지 맛집", Category.RESTAURANT));
        Place place = placeRepository.findAllByMemoryId(memory.getId()).get(0);

        assertThatThrownBy(() -> placeService.updatePlace(memory.getId(), otherMember.getId(), place.getId(),
                updatePlaceDto("고기국수 맛집", Category.RESTAURANT)))
                .isInstanceOf(BusinessException.class)
                .hasMessage(ErrorCode.MEMBER_MEMORY_NOT_FOUND.getMessage());
    }

    // ===== deletePlace =====

    @Test
    @DisplayName("장소 삭제 성공 - deletedAt 세팅")
    void deletePlace_성공() {
        placeService.save(memory.getId(), member.getId(), createPlaceDto("흑돼지 맛집", Category.RESTAURANT));
        Place place = placeRepository.findAllByMemoryId(memory.getId()).get(0);

        placeService.deletePlace(memory.getId(), member.getId(), place.getId());

        Place deleted = placeRepository.findOne(memory.getId(), place.getId()).orElse(null);
        assertThat(deleted).isNull();
    }

    @Test
    @DisplayName("장소 삭제 시 PlacePhoto도 softDelete")
    void deletePlace_사진도_삭제() {
        placeService.save(memory.getId(), member.getId(), createPlaceDto("흑돼지 맛집", Category.RESTAURANT));
        Place place = placeRepository.findAllByMemoryId(memory.getId()).get(0);
        placeService.savePlacePhoto(memory.getId(), member.getId(), place.getId(), "http://photo.img/1");

        placeService.deletePlace(memory.getId(), member.getId(), place.getId());

        List<PlacePhoto> photos = ppRepository.findAllByPlaceId(place.getId());
        assertThat(photos).isEmpty();
    }

    @Test
    @DisplayName("추억 멤버가 아닌 사람이 삭제 시 BusinessException 발생")
    void deletePlace_비멤버_예외발생() {
        placeService.save(memory.getId(), member.getId(), createPlaceDto("흑돼지 맛집", Category.RESTAURANT));
        Place place = placeRepository.findAllByMemoryId(memory.getId()).get(0);

        assertThatThrownBy(() -> placeService.deletePlace(memory.getId(), otherMember.getId(), place.getId()))
                .isInstanceOf(BusinessException.class)
                .hasMessage(ErrorCode.MEMBER_MEMORY_NOT_FOUND.getMessage());
    }

    // ===== savePlacePhoto =====

    @Test
    @DisplayName("장소 사진 등록 성공")
    void savePlacePhoto_성공() {
        placeService.save(memory.getId(), member.getId(), createPlaceDto("흑돼지 맛집", Category.RESTAURANT));
        Place place = placeRepository.findAllByMemoryId(memory.getId()).get(0);

        placeService.savePlacePhoto(memory.getId(), member.getId(), place.getId(), "http://photo.img/1");

        List<PlacePhoto> photos = ppRepository.findAllByPlaceId(place.getId());
        assertThat(photos).hasSize(1);
        assertThat(photos.get(0).getImageUrl()).isEqualTo("http://photo.img/1");
    }

    @Test
    @DisplayName("추억 멤버가 아닌 사람이 사진 등록 시 BusinessException 발생")
    void savePlacePhoto_비멤버_예외발생() {
        placeService.save(memory.getId(), member.getId(), createPlaceDto("흑돼지 맛집", Category.RESTAURANT));
        Place place = placeRepository.findAllByMemoryId(memory.getId()).get(0);

        assertThatThrownBy(() -> placeService.savePlacePhoto(memory.getId(), otherMember.getId(), place.getId(), "http://photo.img/1"))
                .isInstanceOf(BusinessException.class)
                .hasMessage(ErrorCode.MEMBER_MEMORY_NOT_FOUND.getMessage());
    }

    // ===== deletePlacePhoto =====

    @Test
    @DisplayName("장소 사진 삭제 성공")
    void deletePlacePhoto_성공() {
        placeService.save(memory.getId(), member.getId(), createPlaceDto("흑돼지 맛집", Category.RESTAURANT));
        Place place = placeRepository.findAllByMemoryId(memory.getId()).get(0);
        placeService.savePlacePhoto(memory.getId(), member.getId(), place.getId(), "http://photo.img/1");
        PlacePhoto photo = ppRepository.findAllByPlaceId(place.getId()).get(0);

        placeService.deletePlacePhoto(memory.getId(), member.getId(), place.getId(), photo.getId());

        List<PlacePhoto> photos = ppRepository.findAllByPlaceId(place.getId());
        assertThat(photos).isEmpty();
    }

    @Test
    @DisplayName("사진 등록자가 아닌 사람이 삭제 시 BusinessException 발생")
    void deletePlacePhoto_비등록자_예외발생() {
        placeService.save(memory.getId(), member.getId(), createPlaceDto("흑돼지 맛집", Category.RESTAURANT));
        Place place = placeRepository.findAllByMemoryId(memory.getId()).get(0);
        placeService.savePlacePhoto(memory.getId(), member.getId(), place.getId(), "http://photo.img/1");
        PlacePhoto photo = ppRepository.findAllByPlaceId(place.getId()).get(0);

        // otherMember를 memory에 추가
        MemberMemory otherMemberMemory = MemberMemory.create(otherMember, memory);
        mmRepository.save(otherMemberMemory);

        assertThatThrownBy(() -> placeService.deletePlacePhoto(memory.getId(), otherMember.getId(), place.getId(), photo.getId()))
                .isInstanceOf(BusinessException.class)
                .hasMessage(ErrorCode.PLACE_PHOTO_ACCESS_DENIED.getMessage());
    }

    // ===== 헬퍼 메서드 =====

    private CreatePlaceRequestDTO createPlaceDto(String name, Category category) {
        return new CreatePlaceRequestDTO(name, category, "제주시 어딘가", "kakao_" + name,
                BigDecimal.valueOf(33.4996), BigDecimal.valueOf(126.5312),
                "제주", "제주시", LocalDate.of(2026, 5, 2));
    }

    private CreatePlaceRequestDTO createPlaceDto(String name, Category category, String depth1, String depth2) {
        return new CreatePlaceRequestDTO(name, category, "제주시 어딘가", "kakao_" + name,
                BigDecimal.valueOf(33.4996), BigDecimal.valueOf(126.5312),
                depth1, depth2, LocalDate.of(2026, 5, 2));
    }

    private UpdatePlaceRequestDTO updatePlaceDto(String name, Category category) {
        return new UpdatePlaceRequestDTO(name, category, "제주시 어딘가", "kakao_" + name,
                BigDecimal.valueOf(33.4996), BigDecimal.valueOf(126.5312),
                "제주", "제주시", LocalDate.of(2026, 5, 2));
    }
}
