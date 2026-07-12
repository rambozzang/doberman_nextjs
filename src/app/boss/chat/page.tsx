'use client';

import { useChatRooms } from '@/hooks/useChatRooms';
import {
  PageHeader,
  Button,
  RowList,
  RowItem,
  RowThumb,
  EmptyState,
  Skeleton,
} from '@/components/boss/ui';
import { MessageCircle, RefreshCw, Inbox } from 'lucide-react';

export default function BossChatListPage() {
  const { chatRooms, isLoading, error, refreshChatRooms } = useChatRooms();

  return (
    <div className="space-y-4">
      <PageHeader
        title="채팅"
        description="고객과의 상담 메시지를 확인하세요."
        actions={
          <Button
            variant="secondary"
            size="sm"
            icon={RefreshCw}
            onClick={refreshChatRooms}
            disabled={isLoading}
          >
            새로고침
          </Button>
        }
      />

      {error && (
        <div className="rounded-lg border border-boss-error/30 bg-boss-error/10 p-3 text-sm text-boss-error">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-px">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-lg" />
          ))}
        </div>
      ) : chatRooms.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="진행 중인 채팅이 없습니다"
          description="고객이 상담을 요청하면 여기에 표시됩니다."
        />
      ) : (
        <RowList>
          {chatRooms.map((room) => (
            <RowItem
              key={room.roomId}
              href={`/boss/chat/${room.roomId}`}
              leading={<RowThumb icon={MessageCircle} />}
              title={room.partnerName}
              subtitle={room.lastMessage ?? '아직 메시지가 없습니다.'}
              meta={
                <div className="flex flex-col items-end gap-1">
                  <span>{room.lastMessageTime ?? ''}</span>
                  {room.unreadCount > 0 && (
                    <span className="inline-flex items-center justify-center rounded-full bg-boss-primary px-1.5 py-0.5 text-[10px] font-bold text-boss-primary-foreground">
                      {room.unreadCount}
                    </span>
                  )}
                </div>
              }
            />
          ))}
        </RowList>
      )}
    </div>
  );
}
