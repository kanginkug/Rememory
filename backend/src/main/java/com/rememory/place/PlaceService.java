package com.rememory.place;

import com.rememory.common.CommonMethod;
import com.rememory.common.exception.BusinessException;
import com.rememory.common.exception.ErrorCode;
import com.rememory.member.Member;
import com.rememory.member.MemberRepository;
import com.rememory.memory.MemberMemoryRepository;
import com.rememory.memory.Memory;
import com.rememory.memory.MemoryRepository;
import com.rememory.review.Review;
import com.rememory.review.ReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;

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
    private final CommonMethod commonMethod;

    @Transactional
    public void save(Long memoryId, Long creatorId, CreatePlaceRequestDTO cpRequestDTO, MultipartFile file){
        Member creator = memberRepository.findOne(creatorId).orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));
        Memory memory = memoryRepository.findOne(memoryId).orElseThrow(() -> new BusinessException(ErrorCode.MEMORY_NOT_FOUND));

        if(mmRepository.findByMemoryIdAndMemberId(memoryId, creatorId).isEmpty()){
            throw new BusinessException(ErrorCode.MEMBER_MEMORY_NOT_FOUND);
        }

        Place place = Place.create(memory, creator, cpRequestDTO.getName(), cpRequestDTO.getCategory(), cpRequestDTO.getAddress(), cpRequestDTO.getKakaoPlaceId(),
                cpRequestDTO.getLatitude(), cpRequestDTO.getLongitude(), cpRequestDTO.getRegionDepth1(), cpRequestDTO.getRegionDepth2(), cpRequestDTO.getVisitedAt());

        placeRepository.save(place);
        memoryRepository.updatePlaceCount(memoryId, 1);

        if(file != null && !file.isEmpty()){
            savePlacePhoto(memoryId, creatorId, place.getId(), file);
        }
    }

    public List<PlaceDetailResponseDTO> findAllByMemoryId(Long memberId, Long memoryId) {
        certification(memoryId, memberId);
        List<Place> placeList = placeRepository.findAllByMemoryId(memoryId);
        return toResponseDTOList(placeList);
    }

    public List<PlaceDetailResponseDTO> sortPlaceByType(Long memberId, Long memoryId, Category category, String regionDepth1, String regionDepth2) {
        certification(memoryId, memberId);
        List<Place> placeList = placeRepository.findAllByCategoryAndRegion(memoryId, category, regionDepth1, regionDepth2);
        return toResponseDTOList(placeList);
    }

    public List<PlaceDetailResponseDTO> searchByName(Long memberId, Long memoryId, String name) {
        certification(memoryId, memberId);
        List<Place> placeList = placeRepository.findByName(name, memoryId);
        return toResponseDTOList(placeList);
    }

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

        Place place = placeRepository.findOne(memoryId, placeId).orElseThrow(() -> new BusinessException(ErrorCode.PLACE_NOT_FOUND));

        ppRepository.findAllByPlaceId(placeId).forEach(PlacePhoto::delete);
        reviewRepository.findAllByPlaceId(placeId).forEach(Review::delete);

        place.delete();
        memoryRepository.updatePlaceCount(memoryId, -1);
        memoryRepository.recalculateRating(memoryId);
    }

    @Transactional
    public void updatePlace(Long memoryId, Long memberId, Long placeId, UpdatePlaceRequestDTO upReuqestDTO) {
        certification(memoryId, memberId);

        Place place = placeRepository.findOne(memoryId, placeId).orElseThrow(() -> new BusinessException(ErrorCode.PLACE_NOT_FOUND));
        place.update(upReuqestDTO.getName(), upReuqestDTO.getCategory(), upReuqestDTO.getAddress(), upReuqestDTO.getKakaoPlaceId(),
                upReuqestDTO.getLatitude(), upReuqestDTO.getLongitude(), upReuqestDTO.getRegionDepth1(), upReuqestDTO.getRegionDepth2(), upReuqestDTO.getVisitedAt());
    }

    @Transactional
    public void savePlacePhoto(Long memoryId, Long memberId, Long placeId, MultipartFile file) {
        Member member = memberRepository.findOne(memberId).orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));
        if(mmRepository.findByMemoryIdAndMemberId(memoryId, memberId).isEmpty()) {
            throw new BusinessException(ErrorCode.MEMBER_MEMORY_NOT_FOUND);
        }

        Place place = placeRepository.findOne(memoryId, placeId).orElseThrow(() -> new BusinessException(ErrorCode.PLACE_NOT_FOUND));
        String photoUrl = "";
        if(file != null && !file.isEmpty()){
            photoUrl = commonMethod.madePhotoUrl(file);
        }
        if (photoUrl != null && !photoUrl.isEmpty()) {
            PlacePhoto placePhoto = PlacePhoto.create(place, member, photoUrl);
            ppRepository.save(placePhoto);
        } else {
            throw new BusinessException(ErrorCode.PHOTO_NOT_FOUND);
        }

    }

    @Transactional
    public void deletePlacePhoto(Long memoryId, Long memberId, Long placeId, Long placePhotoId){
        certification(memoryId, memberId);
        if(placeRepository.findOne(memoryId, placeId).isEmpty()) {
            throw new BusinessException(ErrorCode.PLACE_NOT_FOUND);
        }
        PlacePhoto placePhoto = ppRepository.findOne(placePhotoId).orElseThrow(() -> new BusinessException(ErrorCode.PLACE_PHOTO_NOT_FOUND));
        if(!placePhoto.getCreator().getId().equals(memberId)) {
            throw new BusinessException(ErrorCode.PLACE_PHOTO_ACCESS_DENIED);
        }

        placePhoto.delete();
    }

    private void certification(Long memoryId, Long memberId){
        if(memberRepository.findOne(memberId).isEmpty()) {
            throw new BusinessException(ErrorCode.MEMBER_NOT_FOUND);
        }

        if(memoryRepository.findOne(memoryId).isEmpty()) {
            throw new BusinessException(ErrorCode.MEMORY_NOT_FOUND);
        }

        if(mmRepository.findByMemoryIdAndMemberId(memoryId, memberId).isEmpty()){
            throw new BusinessException(ErrorCode.MEMBER_MEMORY_NOT_FOUND);
        }
    }

    // Repository에서 조회한 PlaceList를 ResponseDTOList로 변환하는 메서드
    private List<PlaceDetailResponseDTO> toResponseDTOList(List<Place> placeList) {
        List<PlaceDetailResponseDTO> pdResponseDTOList = new ArrayList<>();
        for(Place place : placeList) {
            pdResponseDTOList.add(PlaceDetailResponseDTO.from(place));
        }
        return pdResponseDTOList;
    }
}
