import React, { Fragment, useLayoutEffect, useMemo, useRef } from 'react'
import { View } from 'react-native'
import {
  ListChildComponentProps,
  VariableSizeList,
  VariableSizeListProps,
} from 'react-window'

import { usePrevious } from '../../hooks/use-previous'
import { sharedStyles } from '../../styles/shared'
import { AutoSizer } from '../auto-sizer'
import { OneListInstance, OneListProps } from './index.shared'

export { OneListProps }

const ItemRow = React.memo(
  (props: {
    index: number
    item: any
    itemKey: string
    renderItem: OneListProps<any>['renderItem']
  }) => {
    const { index, item, itemKey, renderItem } = props
    return <Fragment key={itemKey}>{renderItem({ index, item })}</Fragment>
  },
)

interface ItemData {
  data: any[]
  footer?: OneListProps<any>['footer']
  getItemKey?: OneListProps<any>['getItemKey']
  header?: OneListProps<any>['header']
  innerFooterSize: number
  innerHeaderSize: number
  itemCount: number
  itemSeparator?: OneListProps<any>['itemSeparator']
  renderItem: OneListProps<any>['renderItem']
}

const Row = React.memo(
  React.forwardRef<any, ListChildComponentProps>((props, rowRef) => {
    const { index, style } = props
    const {
      data,
      footer,
      getItemKey,
      header,
      innerFooterSize,
      innerHeaderSize,
      itemCount,
      itemSeparator,
      renderItem,
    } = props.data as ItemData

    if (innerHeaderSize && index === 0 && header) {
      return (
        <div
          ref={rowRef}
          key={
            getItemKey
              ? getItemKey(data[index], index)
              : `react-window-row-${index}`
          }
          style={style}
        >
          <header.Component />
        </div>
      )
    }

    if (innerFooterSize && index === itemCount - 1 && footer) {
      return (
        <div ref={rowRef} style={style}>
          <footer.Component />
        </div>
      )
    }

    const dataIndex = innerHeaderSize ? index - 1 : index
    if (!(dataIndex >= 0 && dataIndex <= data.length - 1)) return null

    return (
      <div ref={rowRef} style={style}>
        <View style={[sharedStyles.fullWidth, sharedStyles.fullHeight]}>
          <ItemRow
            index={dataIndex}
            item={data[dataIndex]}
            itemKey={
              getItemKey
                ? getItemKey(data[dataIndex], dataIndex)
                : `react-window-item-row-${dataIndex}`
            }
            renderItem={renderItem}
          />

          {!!(
            dataIndex >= 0 &&
            dataIndex < data.length - 1 &&
            itemSeparator &&
            itemSeparator.size > 0 &&
            itemSeparator.Component
          ) && (
            <itemSeparator.Component
              leading={{ index, item: data[dataIndex] }}
              trailing={
                dataIndex + 1 < data.length - 1
                  ? { index: dataIndex + 1, item: data[dataIndex + 1] }
                  : undefined
              }
            />
          )}
        </View>
      </div>
    )
  }),
)

export const OneList = (React.memo(
  React.forwardRef<OneListInstance, OneListProps<any>>((props, ref) => {
    React.useImperativeHandle(
      ref,
      () => ({
        scrollToStart: () => {
          variableSizeListRef.current!.scrollTo(0)
        },
        scrollToEnd: () => {
          variableSizeListRef.current!.scrollToItem(
            props.data.length - 1,
            'start',
          )
        },
        scrollToIndex: (index, params) => {
          const alignment = params ? params.alignment : 'smart'
          variableSizeListRef.current!.scrollToItem(index, alignment)
        },
      }),
      [props.data.length],
    )

    const {
      ListEmptyComponent,
      data,
      estimatedItemSize,
      footer,
      getItemKey,
      getItemSize,
      header,
      horizontal,
      itemSeparator,
      onVisibleItemsChanged,
      overscanCount,
      pointerEvents,
      renderItem,

      // TODO
      // refreshControl,
    } = props

    const variableSizeListRef = useRef<VariableSizeList>(null)

    const itemSeparatorSize =
      itemSeparator && itemSeparator.Component && itemSeparator.size > 0
        ? itemSeparator.size
        : 0

    const innerHeaderSize =
      header && header.Component && !header.sticky && header.size > 0
        ? header.size
        : 0

    const innerFooterSize =
      footer && footer.Component && !footer.sticky && footer.size > 0
        ? footer.size
        : 0

    const itemCount =
      data.length + (innerHeaderSize ? 1 : 0) + (innerFooterSize ? 1 : 0)

    const itemKey = useMemo<VariableSizeListProps['itemKey']>(() => {
      return index => {
        if (innerHeaderSize && index === 0) return 'header'
        if (innerFooterSize && index === itemCount - 1) return 'footer'

        const dataIndex = innerHeaderSize ? index - 1 : index
        return getItemKey(data[dataIndex], dataIndex)
      }
    }, [data, getItemKey, itemCount])

    const itemSize = useMemo<VariableSizeListProps['itemSize']>(() => {
      return index => {
        if (innerHeaderSize && index === 0) return innerHeaderSize
        if (innerFooterSize && index === itemCount - 1) return innerFooterSize

        const dataIndex = innerHeaderSize ? index - 1 : index
        if (!(dataIndex >= 0 && dataIndex <= data.length - 1)) return 0

        return (
          getItemSize(data[dataIndex], dataIndex) +
          (dataIndex >= 0 && dataIndex < data.length - 1
            ? itemSeparatorSize
            : 0)
        )
      }
    }, [
      data,
      getItemSize,
      innerFooterSize,
      innerHeaderSize,
      itemCount,
      itemSeparatorSize,
    ])

    const onItemsRendered = useMemo<
      VariableSizeListProps['onItemsRendered']
    >(() => {
      if (!onVisibleItemsChanged) return undefined

      return ({ visibleStartIndex, visibleStopIndex }) => {
        const dataIndexFix = innerHeaderSize ? -1 : 0
        return onVisibleItemsChanged(
          visibleStartIndex + dataIndexFix,
          visibleStopIndex + dataIndexFix,
        )
      }
    }, [onVisibleItemsChanged, !!innerHeaderSize])

    const previousItemCount = usePrevious(itemCount)
    const previousItemSize = usePrevious(itemSize)
    useLayoutEffect(() => {
      if (!variableSizeListRef.current) return
      if (!(itemSize && previousItemSize)) return

      const previousSizes = new Array(previousItemCount)
        .fill(true)
        .map((_, index) => previousItemSize(index))
      const newSizes = new Array(itemCount)
        .fill(true)
        .map((_, index) => itemSize(index))

      let firstDifferentIndex = newSizes.findIndex(
        (size, index) => size !== previousSizes[index],
      )

      if (
        !(firstDifferentIndex >= 0) &&
        previousSizes.length !== newSizes.length
      ) {
        firstDifferentIndex = Math.min(
          previousSizes.length - 1,
          newSizes.length - 1,
        )
      }

      if (firstDifferentIndex >= 0) {
        variableSizeListRef.current.resetAfterIndex(firstDifferentIndex, true)
      }
    }, [itemCount, itemSize, previousItemCount, previousItemSize])

    const itemData = useMemo<ItemData>(
      () => ({
        data,
        footer,
        getItemKey,
        header,
        innerFooterSize,
        innerHeaderSize,
        itemCount,
        itemSeparator,
        renderItem,
      }),
      [
        data,
        footer,
        getItemKey,
        header,
        innerFooterSize,
        innerHeaderSize,
        itemCount,
        itemSeparator,
        renderItem,
      ],
    )

    return (
      <View
        pointerEvents={pointerEvents}
        style={[
          sharedStyles.flex,
          sharedStyles.fullWidth,
          sharedStyles.fullHeight,
        ]}
      >
        {header &&
        header.size > 0 &&
        header.Component &&
        (header.sticky || !data.length) ? (
          <header.Component />
        ) : null}

        <View
          style={[
            sharedStyles.flex,
            sharedStyles.fullWidth,
            sharedStyles.fullHeight,
          ]}
        >
          {data.length > 0 ? (
            <AutoSizer disableWidth={!horizontal} disableHeight={horizontal}>
              {({ width, height }) =>
                !!(
                  (horizontal && width > 0) ||
                  (!horizontal && height > 0)
                ) && (
                  <VariableSizeList
                    ref={variableSizeListRef}
                    key="variable-size-list"
                    estimatedItemSize={estimatedItemSize}
                    height={horizontal ? '100%' : height}
                    itemCount={itemCount}
                    itemData={itemData}
                    itemKey={itemKey}
                    itemSize={itemSize}
                    layout={horizontal ? 'horizontal' : 'vertical'}
                    onItemsRendered={onItemsRendered}
                    overscanCount={overscanCount}
                    width={horizontal ? width : '100%'}
                  >
                    {Row}
                  </VariableSizeList>
                )
              }
            </AutoSizer>
          ) : ListEmptyComponent ? (
            <ListEmptyComponent />
          ) : null}
        </View>

        {footer &&
        footer.size > 0 &&
        footer.Component &&
        (footer.sticky || !data.length) ? (
          <footer.Component />
        ) : null}
      </View>
    )
  }),
) as any) as ((<ItemT>(
  props: OneListProps<ItemT> & React.RefAttributes<OneListInstance>,
) => React.ReactElement) & {
  displayName: string
} & OneListInstance)

OneList.displayName = 'OneList'
