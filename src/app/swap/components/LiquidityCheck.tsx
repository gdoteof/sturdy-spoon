import { CheckPositionParams, thorApi } from "@/lib/thor_slice";
import { ActionIcon, Box, Group, Text, Tooltip } from "@mantine/core";
import { PoolDetail } from "@xchainjs/xchain-midgard"
import { AddliquidityPosition, AssetRuneNative, getCryptoAmountWithNotation } from "@xchainjs/xchain-thorchain-query";
import { assetAmount, assetFromString, AssetType, baseAmount, bn, CryptoAmount, formatAssetAmount, formatBaseAmount, TokenAsset } from "@xchainjs/xchain-util";
import { IoAddCircle, IoAddCircleSharp, IoWarning } from "react-icons/io5";

interface LiquidityCheckProps {
    pool: PoolDetail;
    address: string;
}
const LiquidityCheck = (props: LiquidityCheckProps) => {
    const { pool, address } = props;
    const parts = pool.asset.split('.');
    const chain = parts[0];
    const symbol = parts[1];
    const checkPositionParams: CheckPositionParams = {
        address: address,
        asset: {
            chain,
            symbol,
            ticker: pool.asset,
            type: AssetType.NATIVE
        }
    }
    const { isUninitialized: isPCUI, isLoading: isPCL, data: positionData, isError, error } = thorApi.useCheckPositionQuery(checkPositionParams);
    const { position, poolShare, lpGrowth } = positionData ?? {};
    const { rune_address, asset_address, pending_asset, pending_rune, pending_tx_id, units, rune_deposit_value, asset_deposit_value } = position ?? {};
    const { assetShare, runeShare } = poolShare ?? {};
    const pendingAsset = assetFromString(pool.asset);
    if (!pendingAsset) {
        throw new Error(`Invalid asset: ${pool.asset}`);
    }
    const pendingAssetAmount: CryptoAmount = new CryptoAmount(baseAmount(pending_asset), assetFromString(pool.asset)!);
    const addLiquidityParams: AddliquidityPosition = {
        asset: pendingAssetAmount as CryptoAmount<TokenAsset>,
        rune: new CryptoAmount(baseAmount(pending_rune), AssetRuneNative),
    };
    const { data: estimateData, isUninitialized: isECUI, isLoading: isECL, isError: isECError, error: estimateError } =
        thorApi.useEstimateAddLiquidityQuery(addLiquidityParams);

    const hasPending = pending_asset !== undefined || pending_rune !== undefined;
    const Icon = hasPending ? <IoWarning /> : <IoAddCircleSharp />;
    const needsDeposit = pending_asset !== undefined ? pending_rune : pending_asset;
    const depositedShare = pending_asset !== undefined ? assetShare : runeShare;
    const alreadyDepositedSymbol = pending_asset !== undefined ? pool.asset : 'RUNE';
    const needsDepositSymbol = pending_asset !== undefined ? 'RUNE' : pool.asset;

    const depositRatio = bn(estimateData?.runeToAssetRatio ?? "0");
    const requiredRune = depositRatio.multipliedBy(pendingAssetAmount.assetAmount.amount())
    const requiredAsset = requiredRune.div(depositRatio).minus(pendingAssetAmount.assetAmount.amount());
    const pendingMessage = requiredRune.gt(0) ? `You need to deposit ${requiredRune} RUNE to activate your pending ${alreadyDepositedSymbol} deposit` :
        requiredAsset.gt(0) ? `You need to deposit ${requiredAsset} ${pool.asset} to add liquidity` : undefined;
    if (isPCL || isPCUI) {
        return <Text>Loading...</Text>;
    } else if (position === undefined) {
        return null;
    } else if (assetShare !== undefined && runeShare !== undefined) {
        return (
            <Box>
                <Group>

                    <Box>

                        {
                            pendingMessage &&
                            <Text><ActionIcon color={hasPending ? "yellow" : "green"}>{Icon}</ActionIcon>{pendingMessage}</Text>
                        }

                        <Text>Rune share: {runeShare.assetAmount?.amount().toString() ?? 0}</Text>
                        <Text>Asset share: {assetShare.assetAmount?.amount().toString() ?? 0}</Text>
                        <Text>Pending Rune: {assetAmount(pending_rune).div(1e8).amount().toString()}</Text>
                        <Text>Pending Asset: {assetAmount(pending_asset).div(1e8).amount().toString()}</Text>
                        <Text>Rune Address: {rune_address}</Text>
                        <Text>Asset Address: {asset_address}</Text>
                        <Text>Rune to Asset Ratio: {estimateData?.runeToAssetRatio?.toString()}</Text>

                    </Box>
                </Group>
            </Box>
        )
    }
}

export default LiquidityCheck;