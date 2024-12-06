'use client'
import { ActionIcon, ActionIconGroup, Box, CheckIcon, Chip, Divider, Title } from "@mantine/core";
import { walletSlice } from "@/lib/wallet_slice";
import { useSelector } from "react-redux";
import { thorApi } from "@/lib/thor_slice";
import { AddressTable } from "@/app/swap/components/addressTable";
import LiquidityCheck from "@/app/swap/components/LiquidityCheck";
import { Table, TableTr, TableTh, TableTbody, TableTd, TableThead, Text, Paper } from '@mantine/core';
import { btcAPI, CheckBalanceParams, CheckBalanceResponse } from "@/lib/btc_slice";

const WalletContainer = () => {
    const wallet = useSelector(walletSlice.selectors.selectWallet);
    const watchlist = useSelector(walletSlice.selectors.selectFirstAndNonZeroAddresses);
    const { data, isError, isLoading } = thorApi.useListPoolsQuery();
    const pools = data || [];
    const mkMakeRefetch = (checkBalanceParams: Omit<CheckBalanceParams, "addressIndex">) => {
        const makeRefetch = (addressIndex: number) => {
            const path = checkBalanceParams.derivationPath;
            let underlyingApi;
            if (checkBalanceParams.derivationPath.startsWith("m/84'/0'/")) {
                underlyingApi = btcAPI.useCheckBalanceQuery;
            } else if (checkBalanceParams.derivationPath.startsWith("m/44'/931'/")) {
                underlyingApi = thorApi.useCheckBalanceQuery;
            } else {
                throw new Error(`Unsupported derivation path ${path}`);
            }
            const useQuery = underlyingApi({
                ...checkBalanceParams,
                addressIndex
            });
            return useQuery.refetch;
        }
        return makeRefetch;
    }


    return wallet ? (
        <Box>
            <Title>Wallet {wallet.masterFingerprint} </Title>
            < Text > Wallet Type: {wallet.walletType} </Text>
            {
                wallet.coinAccounts.map((coinAccount, accountIndex) => (
                    <Box key={accountIndex} >
                        <Title>{coinAccount.chain} <Chip>{coinAccount.derivationPath}</Chip></Title>
                        {

                        }
                        <AddressTable coinAccount={coinAccount} makeRefetch={mkMakeRefetch({
                            fingerprint: wallet.masterFingerprint,
                            derivationPath: coinAccount.derivationPath,
                            address: coinAccount.derivedAddresses[0].address,
                            accountIndex
                        })} />
                        <Divider />
                        <Title> Pools </Title>
                        <Box key={accountIndex}>
                            <Table>
                                <TableThead>
                                    <TableTr>
                                        <TableTh>Asset </TableTh>
                                        < TableTh > Asset Depth </TableTh>
                                        < TableTh > Rune Depth </TableTh>
                                        < TableTh > APR </TableTh>
                                        < TableTh > Asset Price </TableTh>
                                        < TableTh > Asset Price USD </TableTh>
                                        < TableTh > Actions </TableTh>
                                    </TableTr>
                                </TableThead>
                                <TableTbody>

                                </TableTbody>
                            </Table>


                        </Box>
                    </Box>
                ))}
            <Table>
                <TableThead>
                    <TableTr>
                        <TableTh>Asset </TableTh>
                        <TableTh> Asset Depth </TableTh>
                        <TableTh> Rune Depth </TableTh>
                        <TableTh> APR </TableTh>
                        <TableTh> Asset Price </TableTh>
                        <TableTh> Asset Price USD </TableTh>
                        <TableTh> Actions </TableTh>
                    </TableTr>
                </TableThead>
                <TableTbody>

                    {
                        pools.map((pool, index) => (
                            <TableTr key={index} >
                                <TableTd>{pool.asset.split('-')[0]} </TableTd>
                                <TableTd> {pool.assetDepth} </TableTd>
                                <TableTd> {pool.runeDepth} </TableTd>
                                <TableTd> {(parseFloat(pool.annualPercentageRate) * 100).toFixed(0)} % </TableTd>
                                <TableTd> {parseFloat(pool.assetPrice).toFixed(2)
                                } </TableTd>
                                <TableTd> {parseFloat(pool.assetPriceUSD).toFixed(2)} </TableTd>
                                <TableTd>
                                    <ActionIconGroup>
                                        <ActionIcon>
                                            <CheckIcon />
                                        </ActionIcon>
                                    </ActionIconGroup>
                                </TableTd>
                            </TableTr>

                        ))}
                </TableTbody>
            </Table>
            {
                pools.map((pool, lIndex) => (
                    watchlist?.map((address, index) => (
                        <LiquidityCheck key={`${index}-${lIndex}-${address}`} pool={pool} address={address} />
                    ))))
            }
        </Box>
    ) : <Text>Please scan</Text>
}

export default WalletContainer;