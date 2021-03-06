import React from 'react'
import { FlatListProps } from 'react-native'

export interface OneListInstance {
  scrollToStart: () => void
  scrollToEnd: () => void
  scrollToIndex: (
    index: number,
    payload?: { alignment?: 'start' | 'center' | 'end' | 'smart' },
  ) => void
}

export interface OneListProps<ItemT> {
  ListEmptyComponent?: React.ComponentType
  data: ItemT[]
  estimatedItemSize: number
  footer?: {
    Component: React.ComponentType
    size: number
    sticky?: boolean
  }
  getItemKey: (item: ItemT, index: number) => string
  getItemSize: (item: ItemT, index: number) => number
  header?: {
    Component: React.ComponentType
    size: number
    sticky?: boolean
  }
  horizontal?: boolean
  itemSeparator?: {
    Component: React.ComponentType<{
      leading?: { item: ItemT; index: number }
      trailing?: { item: ItemT; index: number }
    }>
    size: number
  }
  onVisibleItemsChanged?: (fromIndex: number, toIndex: number) => void
  overscanCount: number
  pointerEvents?: 'box-none' | 'none' | 'box-only' | 'auto'
  renderItem: (info: { item: ItemT; index: number }) => React.ReactElement

  // TODO: Support refreshControl on web
  refreshControl?: FlatListProps<any>['refreshControl']
}
