import { CheckPositionParams, thorApi } from "@/lib/thor_slice";
import { Box, Text } from "@mantine/core";
import { PoolDetail } from "@xchainjs/xchain-midgard"
import { AssetType } from "@xchainjs/xchain-util";

interface LiquidityCheckProps {
    pool: PoolDetail;
    address: string;
}
const LiquidityCheck = (props: LiquidityCheckProps) => {
    const { pool, address } = props;
    const parts = pool.asset.split('.');
    const chain = parts[0];
    const symbol = parts[1];
    const queryParams: CheckPositionParams = {
        address: address,
        asset: {
            chain,
            symbol,
            ticker: pool.asset,
            type: AssetType.NATIVE
        }
    }
    const { isUninitialized, isLoading, data, isError, error } = thorApi.useCheckPositionQuery(queryParams);
    const { position, poolShare, lpGrowth } = data ?? {};
    const { rune_address, asset_address, pending_asset, pending_rune, pending_tx_id, units, rune_deposit_value, asset_deposit_value } = position ?? {};
    const { assetShare, runeShare } = poolShare ?? {};
    if (isLoading || isUninitialized) {
        return <Text>Loading...</Text>;
    } else if (position === undefined) {
        return null;
    } else {
        return (
            <Box>
                <Text>Rune Address: {rune_address}</Text>
                <Text>Asset Address: {asset_address}</Text>
                <Text>Pending Asset: {pending_asset}</Text>
                <Text>Pending Rune: {pending_rune}</Text>
                <Text>Pending Transaction ID: {pending_tx_id}</Text>
                <Text>Units: {units}</Text>
                <Text>Rune Deposit Value: {rune_deposit_value}</Text>
                <Text>Asset Deposit Value: {asset_deposit_value}</Text>
                <Text>Asset Share: {assetShare?.assetAmountFixedString()}</Text>
                <Text>Rune Share: {runeShare?.assetAmountFixedString()}</Text>
            </Box>
        )
    }
}

export default LiquidityCheck;