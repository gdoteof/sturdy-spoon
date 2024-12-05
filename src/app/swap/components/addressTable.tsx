'use client';
import { btcAPI } from '@/lib/btc_slice';
import { AddressWithBalance } from '@/lib/keystone_api';
import { thorApi } from '@/lib/thor_slice';
import { CoinAccount } from '@/lib/wallet_slice';
import { Table, TableTr, TableTh, TableTbody, TableTd, TableThead, Text, Paper, ActionIcon, ActionIconGroup } from '@mantine/core';
import { IoRefresh } from "react-icons/io5";
import { useDispatch } from 'react-redux';

interface AddressTableProps {
    coinAccount: CoinAccount;
}

const formatBalance = (balance: number) => {
    return (balance/1e8).toFixed(2);
}

export const AddressTable = (props: AddressTableProps) => {
    return (
    <Paper shadow="xs" p="md">
        <Table>
            <TableThead>
                <TableTr>
                    <TableTh>Index</TableTh>
                    <TableTh>Address</TableTh>
                    <TableTh>Balance</TableTh>
                </TableTr>
            </TableThead>
            <TableTbody>
                {props.coinAccount.derivedAddresses.map((info, index) => (
                    <AddressRow address={info} symbol={props.coinAccount.chain} key={index}/>
                ))}
            </TableTbody>
        </Table>
    </Paper>
);
}

const lazyQueryFromSymbol = (symbol: string) => {
    switch (symbol) {
        case 'BTC':
            return btcAPI.useLazyCheckBalanceQuery
        case 'RUNE':
            return thorApi.useLazyCheckBalanceQuery;
        default:
            throw new Error(`Unsupported symbol ${symbol}`);
    }
}

const queryFromSymbol = (symbol: string) => {
    switch (symbol) {
        case 'BTC':
            return btcAPI.useCheckBalanceQuery
        case 'RUNE':
            return thorApi.useCheckBalanceQuery;
        default:
            throw new Error(`Unsupported symbol ${symbol}`);
    }
}

const AddressRow = (props: {address: AddressWithBalance, symbol: string}) => {
    const  { data, refetch } = queryFromSymbol(props.symbol)(props.address.address);
    return (
                    <TableTr key={props.address.index}>
                        <TableTd>{props.address.index}</TableTd>
                        <TableTd>
                            <Text style={{ fontFamily: 'monospace' }}>
                                {props.address.address}
                            </Text>
                        </TableTd>
                        <TableTd>
                            {formatBalance(data ?? props.address.balance)} {props.symbol}
                            <ActionIconGroup className='inline'>
                                <ActionIcon onClick={() => refetch()}><IoRefresh/></ActionIcon>
                            </ActionIconGroup>
                            </TableTd>
                    </TableTr>
    );
}