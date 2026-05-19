package com.rememory.place;

import com.rememory.common.exception.BusinessException;
import com.rememory.common.exception.ErrorCode;
import com.rememory.member.Member;
import com.rememory.member.MemberRepository;
import com.rememory.memory.MemberMemoryRepository;
import com.rememory.memory.Memory;
import com.rememory.memory.MemoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PlaceService {

    private final PlaceRepository placeRepository;
    private final PlacePhotoRepository ppRepository;
    private final MemberRepository memberRepository;
    private final MemoryRepository memoryRepository;
    private final MemberMemoryRepository mmRepository;

    @Transactional
    public void save(Long memoryId, Long creatorId, CreatePlaceRequestDTO cpRequestDTO){
        Member creator = memberRepository.findOne(creatorId).orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));
        Memory memory = memoryRepository.findOne(memoryId).orElseThrow(() -> new BusinessException(ErrorCode.MEMORY_NOT_FOUND));

        if(mmRepository.findByMemoryIdAndMemberId(memoryId, creatorId).isEmpty()){
            throw new BusinessException(ErrorCode.MEMBER_MEMORY_NOT_FOUND);
        }


        Place place = Place.create(memory, creator, cpRequestDTO.getName(), cpRequestDTO.getCategory(), cpRequestDTO.getAddress(), cpRequestDTO.getKakaoPlaceId(),
                cpRequestDTO.getLatitude(), cpRequestDTO.getLongitude(), BigDecimal.valueOf(0), 0,
                cpRequestDTO.getRegion_depth1(), cpRequestDTO.getRegion_depth2(), cpRequestDTO.getVisitedAt());

        placeRepository.save(place);
    }

    public List<Place> findAll(Long memoryId) {
        return placeRepository.findAllByMemoryId(memoryId);
    }

    public List<Place> sortPlaceByType(Long memoryId, Category category, String regionDepth1, String regionDepth2) {
        return placeRepository.findAllByCategoryAndRegion(memoryId, category, regionDepth1, regionDepth2);
    }

    public List<Place> searchByName(Long memoryId, String name) {
        return placeRepository.findByName(name, memoryId);
    }

    @Transactional
    public void deletePlace(Long memoryId, Long memberId, Long placeId) {
        certification(memoryId, memberId);

        Place place = placeRepository.findOne(memoryId, placeId).orElseThrow(() -> new BusinessException(ErrorCode.PLACE_NOT_FOUND));

        // PlacePhoto softDelete
        ppRepository.findAllByPlaceId(placeId).forEach(PlacePhoto::delete);

        place.delete();
    }

    @Transactional
    public void updatePlace(Long memoryId, Long memberId, Long placeId, UpdatePlaceRequestDTO upReuqestDTO) {
        certification(memoryId, memberId);

        Place place = placeRepository.findOne(memoryId, placeId).orElseThrow(() -> new BusinessException(ErrorCode.PLACE_NOT_FOUND));
        place.update(upReuqestDTO.getName(), upReuqestDTO.getCategory(), upReuqestDTO.getAddress(), upReuqestDTO.getKakaoPlaceId(),
                upReuqestDTO.getLatitude(), upReuqestDTO.getLongitude(), upReuqestDTO.getRegion_depth1(), upReuqestDTO.getRegion_depth2(), upReuqestDTO.getVisitedAt());
    }

    @Transactional
    public void savePlacePhoto(Long memoryId, Long memberId, Long placeId, String imageUrl) {
        Member member = memberRepository.findOne(memberId).orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));
        if(mmRepository.findByMemoryIdAndMemberId(memoryId, memberId).isEmpty()) {
            throw new BusinessException(ErrorCode.MEMBER_MEMORY_NOT_FOUND);
        }

        Place place = placeRepository.findOne(memoryId, placeId).orElseThrow(() -> new BusinessException(ErrorCode.PLACE_NOT_FOUND));
        PlacePhoto placePhoto = PlacePhoto.create(place, member, imageUrl);
        ppRepository.save(placePhoto);
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

    public void certification(Long memoryId, Long memberId){
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


}
