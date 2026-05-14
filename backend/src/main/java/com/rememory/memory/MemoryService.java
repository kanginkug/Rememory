package com.rememory.memory;

import com.rememory.common.commonEnum.SortType;
import com.rememory.common.exception.BusinessException;
import com.rememory.common.exception.ErrorCode;
import com.rememory.member.Member;
import com.rememory.member.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class MemoryService {
    private final MemoryRepository memoryRepository;
    private final MemberRepository memberRepository;

    @Transactional
    public void createMemory(Long creatorId, CreateMemoryRequestDTO memory) {
        Member member = memberRepository.findOne(creatorId).orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));

        Memory createMemory = Memory.create(member, memory.getMemoryName(), memory.getDescription(), memory.getStartDate(), memory.getEndDate());
        memoryRepository.save(createMemory);
    }

    @Transactional
    public void updateMemory(Long memberId, Long memoryId, UpdateMemoryRequestDTO memory) {
        Member updater = memberRepository.findOne(memberId).orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));
        Memory updateMemory = memoryRepository.findOne(memoryId).orElseThrow(() -> new BusinessException(ErrorCode.MEMORY_NOT_FOUND));

        if(!updater.getId().equals(updateMemory.getCreator().getId())){
            throw new BusinessException(ErrorCode.MEMORY_NOT_CREATOR);
        }

        updateMemory.update(memory.getMemoryName(), memory.getShowHistoryToNew(), memory.getDescription(), memory.getStartDate(), memory.getEndDate());
    }

    public List<Memory> findMemoryList(Long memberId, SortType sortType, String keyword){
        return memoryRepository.findAllByMemberId(memberId, sortType, keyword);
    }

    @Transactional
    public void deleteMemory(Long memberId, Long memoryId) {
        Member deleter = memberRepository.findOne(memberId).orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));
        Memory deleteMemory = memoryRepository.findOne(memoryId).orElseThrow(() -> new BusinessException(ErrorCode.MEMORY_NOT_FOUND));

        if(!deleter.getId().equals(deleteMemory.getCreator().getId())){
            throw new BusinessException(ErrorCode.MEMORY_NOT_CREATOR);
        }
        deleteMemory.delete();
    }

    public Memory findOne(Long memoryId, Long memberId) {
        Memory memory = memoryRepository.findOne(memoryId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMORY_NOT_FOUND));

        // 멤버가 이 Memory에 속해있는지 체크 (나중에 MemberMemoryRepository 생기면 추가)
        return memory;
    }
}
