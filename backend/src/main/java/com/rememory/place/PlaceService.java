package com.rememory.place;

import com.rememory.common.exception.BusinessException;
import com.rememory.common.exception.ErrorCode;
import com.rememory.common.s3.service.UploadService;
import com.rememory.member.Member;
import com.rememory.member.MemberRepository;
import com.rememory.member.fcm.FcmService;
import com.rememory.memory.MemberMemory;
import com.rememory.memory.MemberMemoryRepository;
import com.rememory.memory.Memory;
import com.rememory.memory.MemoryRepository;
import com.rememory.review.ReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PlaceService {
    private final PlaceRepository placeRepository;

    private final PlacePhotoRepository ppRepository;
    private final MemberRepository memberRepository;
    private final MemoryRepository memoryRepository;
    private final ReviewRepository reviewRepository;
    private final MemberMemoryRepository mmRepository;
    private final UploadService uploadService;
    private final FcmService fcmService;

    /** 장소 생성 + 사진 업로드 + placeCount 갱신 */
    @Transactional
    public void save(Long memoryId, Long creatorId, CreatePlaceRequestDTO cpRequestDTO){
        Member creator = memberRepository.findOne(creatorId).orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));
        Memory memory = memoryRepository.findOne(memoryId).orElseThrow(() -> new BusinessException(ErrorCode.MEMORY_NOT_FOUND));

        if(mmRepository.findActiveByMemoryIdAndMemberId(memoryId, creatorId).isEmpty()){
            throw new BusinessException(ErrorCode.MEMBER_MEMORY_NOT_FOUND);
        }

        Place place = Place.create(memory, creator, cpRequestDTO.getName(), cpRequestDTO.getDescription(), cpRequestDTO.getCategory(), cpRequestDTO.getAddress(), cpRequestDTO.getDetailAddress(), cpRequestDTO.getKakaoPlaceId(), cpRequestDTO.getKakaoPlaceName(),
                cpRequestDTO.getLatitude(), cpRequestDTO.getLongitude(), cpRequestDTO.getRegionDepth1(), cpRequestDTO.getRegionDepth2(), cpRequestDTO.getVisitedAt());

        placeRepository.save(place);
        memoryRepository.updatePlaceCount(memoryId, 1);

        if(cpRequestDTO.getPhotoUrlList() != null && !cpRequestDTO.getPhotoUrlList().isEmpty()){
            savePlacePhoto(memoryId, creatorId, place.getId(), cpRequestDTO.getPhotoUrlList());
        }

        String fcmTitle = "새 장소가 추가됐어요.";
        String body = creator.getName() + "님이 장소를 추가했습니다.";
        // 추억 멤버 id 목록 조회
        List<MemberMemory> members = mmRepository.findActiveByMemoryId(memory.getId());
        for(MemberMemory receiver : members){
            if (receiver.getMember().getId().equals(creatorId)) continue;
            fcmService.sendNotification(receiver.getMember().getId(), fcmTitle, body, "/place/" + memoryId + "/" + place.getId(), com.rememory.member.fcm.FcmNotificationType.PLACE);
        }
    }

    /** 추억 내 전체 장소 조회 (대표 사진 포함, N+1 방지 IN 쿼리) */
    public List<PlaceDetailResponseDTO> findAllByMemoryId(Long memberId, Long memoryId) {
        certification(memoryId, memberId);
        List<Place> placeList = placeRepository.findAllByMemoryId(memoryId);
        return toResponseDTOList(placeList);
    }

    /** 내 베스트 장소 조회 (내 모든 추억 기준, 평점 높은 순) */
    public List<PlaceBestResponseDTO> findBestPlace(Long memberId) {
        if(memberRepository.findOne(memberId).isEmpty()) {
            throw new BusinessException(ErrorCode.MEMBER_NOT_FOUND);
        }
        List<Place> bestPlaces = placeRepository.findBestPlace(memberId);
        if (bestPlaces.isEmpty()) return List.of();
        List<Long> placeIds = bestPlaces.stream().map(Place::getId).toList();
        Map<Long, PlacePhotoResponseDTO> thumbMap = ppRepository.findThumbByPlaceIdList(placeIds);

        return bestPlaces.stream()
                .map(place -> {
                    List<PlacePhotoResponseDTO> photos = thumbMap.containsKey(place.getId())
                            ? List.of(thumbMap.get(place.getId()))
                            : List.of();
                    return PlaceBestResponseDTO.from(place, photos);
                })
                .toList();
    }

    /** 카테고리·지역(depth1/depth2) 필터 적용 조회 */
    public List<PlaceDetailResponseDTO> sortPlaceByType(Long memberId, Long memoryId, Category category, String regionDepth1, String regionDepth2) {
        certification(memoryId, memberId);
        List<Place> placeList = placeRepository.findAllByCategoryAndRegion(memoryId, category, regionDepth1, regionDepth2);
        return toResponseDTOList(placeList);
    }

    /** 장소명으로 검색 */
    public List<PlaceDetailResponseDTO> searchByName(Long memberId, Long memoryId, String name) {
        certification(memoryId, memberId);
        List<Place> placeList = placeRepository.findByName(name, memoryId);
        return toResponseDTOList(placeList);
    }

    /** 장소 상세 조회 + 전체 사진 목록 */
    public PlaceDetailResponseDTO detailPlace(Long memberId, Long memoryId, Long placeId) {
        certification(memoryId, memberId);
        Place place = placeRepository.findOne(memoryId, placeId).orElseThrow(() -> new BusinessException(ErrorCode.PLACE_NOT_FOUND));
        List<PlacePhoto> placePhotoList = ppRepository.findAllByPlaceId(placeId);
        List<PlacePhotoResponseDTO> ppResponseDTO = new ArrayList<>();
        if (!placePhotoList.isEmpty()) {
            for(PlacePhoto placePhoto : placePhotoList) {
                ppResponseDTO.add(PlacePhotoResponseDTO.from(placePhoto));
            }
        }
        return PlaceDetailResponseDTO.from(place, ppResponseDTO);
    }

    /**
     * 장소 삭제 — 연관 데이터 cascade softDelete 후 통계 갱신
     * 순서: 사진 → 리뷰 softDelete → 장소 softDelete → placeCount-- → avgRating 재계산
     * place.delete()가 flush된 뒤 recalculateRating이 실행되므로 삭제된 장소는 집계에서 제외됨
     */
    @Transactional
    public void deletePlace(Long memoryId, Long memberId, Long placeId) {
        certification(memoryId, memberId);
        Memory memory = memoryRepository.findOne(memoryId).orElseThrow(() -> new BusinessException(ErrorCode.MEMORY_NOT_FOUND));
        Place place = placeRepository.findOne(memoryId, placeId).orElseThrow(() -> new BusinessException(ErrorCode.PLACE_NOT_FOUND));

        if (!reviewRepository.findAllByPlaceId(placeId).isEmpty()) {
            throw new BusinessException(ErrorCode.PLACE_HAS_REVIEWS);
        }

        List<PlacePhoto> urls = ppRepository.findAllByPlaceId(placeId);
        List<String> photoUrls = urls.stream()
                .map(PlacePhoto::getImageUrl)
                .toList();
        uploadService.deleteAll(photoUrls);
        urls.forEach(PlacePhoto::delete);
        place.delete();
        memoryRepository.updatePlaceCount(memoryId, -1);
        memoryRepository.recalculateRating(memoryId);
    }

    /** 장소 정보 수정 */
    @Transactional
    public void updatePlace(Long memoryId, Long memberId, Long placeId, UpdatePlaceRequestDTO upReuqestDTO) {
        certification(memoryId, memberId);

        Place place = placeRepository.findOne(memoryId, placeId).orElseThrow(() -> new BusinessException(ErrorCode.PLACE_NOT_FOUND));
        place.update(upReuqestDTO.getName(), upReuqestDTO.getDescription(), upReuqestDTO.getCategory(), upReuqestDTO.getAddress(), upReuqestDTO.getDetailAddress(), upReuqestDTO.getKakaoPlaceId(), upReuqestDTO.getKakaoPlaceName(),
                upReuqestDTO.getLatitude(), upReuqestDTO.getLongitude(), upReuqestDTO.getRegionDepth1(), upReuqestDTO.getRegionDepth2(), upReuqestDTO.getVisitedAt());
    }

    /** 장소 사진 업로드 (최대 5장 제한) */
    @Transactional
    public void savePlacePhoto(Long memoryId, Long memberId, Long placeId, List<String> photoUrlList) {
        Member member = memberRepository.findOne(memberId).orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));
        if(mmRepository.findActiveByMemoryIdAndMemberId(memoryId, memberId).isEmpty()) {
            throw new BusinessException(ErrorCode.MEMBER_MEMORY_NOT_FOUND);
        }

        Place place = placeRepository.findOne(memoryId, placeId).orElseThrow(() -> new BusinessException(ErrorCode.PLACE_NOT_FOUND));

        if (photoUrlList != null && !photoUrlList.isEmpty()) {
            if(ppRepository.countByPlaceId(placeId) + photoUrlList.size() > 5) {
                throw new BusinessException(ErrorCode.PLACE_PHOTO_MAX_COUNT);
            }

            for(String photoUrl : photoUrlList) {
                PlacePhoto placePhoto = PlacePhoto.create(place, member, photoUrl);
                ppRepository.save(placePhoto);
            }
        } else {
            throw new BusinessException(ErrorCode.PHOTO_NOT_FOUND);
        }
    }

    /** 장소 사진 삭제 (작성자 본인만 가능) */
    @Transactional
    public void deletePlacePhoto(Long memoryId, Long memberId, Long placeId, DeletePlacePhotoRequestDTO deletePlacePhotoRequestDTO){
        certification(memoryId, memberId);
        if(placeRepository.findOne(memoryId, placeId).isEmpty()) {
            throw new BusinessException(ErrorCode.PLACE_NOT_FOUND);
        }
        List<Long> placePhotoIdList = deletePlacePhotoRequestDTO.getPlacePhotoIdList();
        List<PlacePhoto> placePhotoList = ppRepository.findAllByPlaceId(placeId).stream()
                .filter(p -> placePhotoIdList.contains(p.getId()))
                .toList();
        for(PlacePhoto placePhoto : placePhotoList) {
            if(!placePhoto.getCreator().getId().equals(memberId)) {
                throw new BusinessException(ErrorCode.PLACE_PHOTO_ACCESS_DENIED);
            }
        }
        List<String> urls = placePhotoList.stream()
                        .map(PlacePhoto::getImageUrl)
                                .toList();
        uploadService.deleteAll(urls);
        placePhotoList.forEach(PlacePhoto::delete);
    }

    /** 멤버·추억 존재 여부 및 추억 접근 권한 통합 검증 */
    private void certification(Long memoryId, Long memberId){

        if(memoryRepository.findOne(memoryId).isEmpty()) {
            throw new BusinessException(ErrorCode.MEMORY_NOT_FOUND);
        }

        if(mmRepository.findActiveByMemoryIdAndMemberId(memoryId, memberId).isEmpty()){
            throw new BusinessException(ErrorCode.MEMBER_MEMORY_NOT_FOUND);
        }
    }

    /** Repository에서 조회한 PlaceList를 ResponseDTOList로 변환 */
    private List<PlaceDetailResponseDTO> toResponseDTOList(List<Place> placeList) {
        if (placeList.isEmpty()) return List.of();
        List<Long> placeIds = placeList.stream().map(Place::getId).toList();
        Map<Long, PlacePhotoResponseDTO> thumbMap = ppRepository.findThumbByPlaceIdList(placeIds);

        return placeList.stream()
                .map(place -> {
                    List<PlacePhotoResponseDTO> photos = thumbMap.containsKey(place.getId())
                            ? List.of(thumbMap.get(place.getId()))
                            : List.of();
                    return PlaceDetailResponseDTO.from(place, photos);
                })
                .toList();
    }

    /** 내 모든 추억의 장소 좌표 목록 조회 (지도 뷰용) */
    public List<PlaceMapResponseDTO> findAllPlaceInfo(Long memberId) {
        return placeRepository.findAllPlaceInfo(memberId).stream().map(PlaceMapResponseDTO::from).toList();
    }
}
