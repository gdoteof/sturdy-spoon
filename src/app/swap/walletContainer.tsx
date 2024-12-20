'use client'
import { ActionIcon, ActionIconGroup, Box, CheckIcon, Chip, Container, Divider, Title } from "@mantine/core";
import { CoinAccount, walletSlice } from "@/lib/wallet_slice";
import { useSelector } from "react-redux";
import { thorApi } from "@/lib/thor_slice";
import { AddressTable } from "@/app/swap/components/addressTable";
import LiquidityCheck from "@/app/swap/components/LiquidityCheck";
import { Table, TableTr, TableTh, TableTbody, TableTd, TableThead, Text, Paper } from '@mantine/core';
import { uiSlice } from "@/lib/ui_slice";

const WalletContainer = () => {
    const wallet = useSelector(walletSlice.selectors.selectWallet);
    const watchlist = useSelector(walletSlice.selectors.selectFirstAndNonZeroAddresses);
    const enabledCoins = useSelector(uiSlice.selectors.getWalletSymbols);
    const { data, isError, isLoading } = thorApi.useListPoolsQuery();
    const pools = data || [];
    const coinAccountsByChain = wallet?.coinAccounts.reduce((acc, account) => {
        if (!acc[account.chain]) {
            acc[account.chain] = [];
        }
        if (!enabledCoins.includes(account.chain)) {
            return acc;
        }
        acc[account.chain].push(account);
        return acc;
    }, {} as Record<string, CoinAccount[]>);


    return wallet ? (
        <Box>
            <Title>Wallet {wallet.masterFingerprint} </Title>
            < Text > Wallet Type: {wallet.walletType} </Text>
            {
                Object.entries(coinAccountsByChain).map(([chain, coinAccounts]) =>

                    <Container size={"xl"} key={chain}>
                        <Title>{chain}</Title>

                        {coinAccounts.map((coinAccount, accountIndex) => (

                            <Box key={accountIndex} >
                                <Title>{coinAccount.derivationPath}</Title>
                                <AddressTable coinAccount={coinAccount} fingerPrint={wallet.masterFingerprint} />
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
                    </Container>
                )}

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
                                    {
                                        watchlist?.map((address, index) => (
                                            <LiquidityCheck key={`${pool.asset}-${index}`} pool={pool} address={address} />
                                        ))
                                    }
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
        </Box>
    ) : <Text>Please scan</Text>
}

export default WalletContainer;