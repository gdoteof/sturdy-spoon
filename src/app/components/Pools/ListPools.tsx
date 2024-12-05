import React, { useEffect } from "react";
import { cetusApi, cetusSlice, loadPoolsFromIndexedDB } from "@/lib/cetus_slice";
import { useDispatch, useSelector } from "react-redux";
import {
    Title,
    Text,
    Button,
    Table,
    TextInput,
    MultiSelect,
    RangeSlider,
    Checkbox,
    Stack,
    Box,
    Code,
} from "@mantine/core";
import { ThunkDispatch } from "@reduxjs/toolkit";
import { Pool } from "@cetusprotocol/cetus-sui-clmm-sdk";


const formatCoin = (coin: string) => {
    const parts = coin.split("::");
    return parts[parts.length - 1];
};

const ListPoolsRaw = () => {
    const { data, error, isLoading, isFetching, isSuccess } = cetusApi.useGetPoolsQuery(undefined, {
        refetchOnMountOrArgChange: false,
        skip: false,
    });
    const cachedPools = useSelector(cetusSlice.selectors.getAllPools);
    const message = useSelector(cetusSlice.selectors.getStatusMessage);
    const filters = useSelector(cetusSlice.selectors.getFilters);
    const dispatch: ThunkDispatch<any, any, any> = useDispatch();
    const { nameFilter, coinTypeAFilter, coinTypeBFilter, feeRateFilter, isPauseFilter } = filters;

    useEffect(() => {
        dispatch(loadPoolsFromIndexedDB());
    }, [dispatch]);

    const ourPools: Pool[] = data?.length ? data : cachedPools;

    // Filter state variables


    // Extract unique coin types for filters
    const coinTypeAOptions = React.useMemo(() => {
        const types = new Set<string>();
        ourPools?.forEach((pool) => {
            if (pool.coinTypeA) types.add(pool.coinTypeA);
        });
        return Array.from(types).map((type) => ({ value: type, label: type }));
    }, [ourPools]);

    const coinTypeBOptions = React.useMemo(() => {
        const types = new Set<string>();
        ourPools?.forEach((pool) => {
            if (pool.coinTypeB) types.add(pool.coinTypeB);
        });
        return Array.from(types).map((type) => ({ value: type, label: type }));
    }, [ourPools]);

    // Calculate min and max values for fee rate and liquidity
    const feeRateMinMax = React.useMemo(() => {
        let min = 0,
            max = 0;
        ourPools?.forEach((pool) => {
            const feeRate = typeof pool.fee_rate === "string" ? parseFloat(pool.fee_rate) : pool.fee_rate;
            if (pool.fee_rate < min) min = feeRate;
            if (pool.fee_rate > max) max = feeRate;
        });
        return { min: min || 0, max: max || 0 };
    }, [ourPools]);

    const liquidityMinMax = React.useMemo(() => {
        let min = 0,
            max = 0;
        ourPools?.forEach((pool) => {
            const liquidity = typeof pool.liquidity === "string" ? parseFloat(pool.liquidity) : pool.liquidity;
            if (pool.liquidity < min) {
                min = liquidity;
            }
            if (pool.liquidity > max) {
                max = liquidity;
            }
        });
        return { min: min || 0, max: max || 0 };
    }, [ourPools]);

    // Update fee rate and liquidity filters when min/max values change
    React.useEffect(() => {
        dispatch(cetusSlice.actions.setFeeRateFilter([feeRateMinMax.min, feeRateMinMax.max]));
    }, [feeRateMinMax]);


    // Filter the pools based on filter values
    const filteredPools = React.useMemo(() => {
        return ourPools?.filter((pool) => {
            // Name filter
            if (nameFilter && !pool.name.toLowerCase().includes(nameFilter.toLowerCase())) {
                return false;
            }
            // Coin Type A filter
            if (coinTypeAFilter.length > 0 && !coinTypeAFilter.includes(pool.coinTypeA)) {
                return false;
            }
            // Coin Type B filter
            if (coinTypeBFilter.length > 0 && !coinTypeBFilter.includes(pool.coinTypeB)) {
                return false;
            }
            // Fee Rate filter
            if (pool.fee_rate < feeRateFilter[0] || pool.fee_rate > feeRateFilter[1]) {
                return false;
            }
            // Is Pause filter
            if (isPauseFilter !== null && pool.is_pause !== isPauseFilter) {
                return false;
            }
            // Liquidity range filter
            return true;
        });
    }, [
        ourPools,
        nameFilter,
        coinTypeAFilter,
        coinTypeBFilter,
        feeRateFilter,
        isPauseFilter,
    ]);

    return (
        <>
            <Text>{message}</Text>
            <Title order={2}>Pools ({filteredPools?.length || 0})</Title>
            <Code>
                {JSON.stringify(liquidityMinMax, null, 2)}

            </Code>

            {(
                <>
                    {/* Filter Components */}
                    <Box mb="md">
                        <Stack>
                            <TextInput
                                label="Name"
                                placeholder="Filter by name"
                                value={nameFilter}
                                onChange={(event) => dispatch(cetusSlice.actions.setNameFilter(event.currentTarget.value))}
                            />

                            <MultiSelect
                                label="Coin Type A"
                                placeholder="Select coin types"
                                data={coinTypeAOptions}
                                value={coinTypeAFilter}
                                onChange={(event) => dispatch(cetusSlice.actions.setCoinTypeAFilter(event))}
                            />

                            <MultiSelect
                                label="Coin Type B"
                                placeholder="Select coin types"
                                data={coinTypeBOptions}
                                value={coinTypeBFilter}
                                onChange={(event) => dispatch(cetusSlice.actions.setCoinTypeBFilter(event))}
                            />

                            <RangeSlider
                                label="Fee Rate"
                                min={feeRateMinMax.min}
                                max={feeRateMinMax.max}
                                value={feeRateFilter}
                                onChange={(value) => {
                                    const newValue = value as [number, number];
                                    console.log("newValue", newValue);
                                    dispatch(cetusSlice.actions.setFeeRateFilter(newValue));
                                }}

                            />

                            <Checkbox
                                label="Show Paused Pools Only"
                                checked={isPauseFilter === true}
                                indeterminate={isPauseFilter === null}
                                onChange={(event) => {
                                    dispatch(cetusSlice.actions.setIsPauseFilter(event.currentTarget.checked));
                                }}
                            />

                            <RangeSlider
                                label="Liquidity Range"
                                min={liquidityMinMax.min}
                                max={liquidityMinMax.max}

                                onChange={(value) => {
                                    const newValue = value as [number, number];
                                    console.log("newValue", newValue);
                                }}
                            />
                        </Stack>
                    </Box>

                    {/* Table of Pools */}
                    {filteredPools?.length ? (
                        <Table striped highlightOnHover>
                            <thead>
                                <tr>
                                    <th>Pool</th>
                                    <th>ID</th>
                                    <th>Coins</th>
                                    <th>Fee Rate</th>
                                    <th>Price</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredPools.map((pool) => (
                                    <tr key={pool.index}>
                                        <td>{pool.name}</td>
                                        <td>{pool.index}</td>
                                        <td>
                                            {formatCoin(pool.coinTypeA)} / {formatCoin(pool.coinTypeB)}
                                        </td>
                                        <td>{pool.fee_rate}</td>
                                        <td>{pool.current_sqrt_price}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    ) : (
                        <Text>No pools match the current filters.</Text>
                    )}
                </>
            )}
        </>
    );
};

export default ListPoolsRaw;
