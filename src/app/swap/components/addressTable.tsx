'use client';
import { getSendableAddress } from '@/app/swap/utils/chainHelpers';
import { btcAPI } from '@/lib/btc_slice';
import { thorApi } from '@/lib/thor_slice';
import { CoinAccount } from '@/lib/wallet_slice';
import { Table, TableTr, TableTh, TableTbody, TableTd, TableThead, Text, Paper, ActionIcon, ActionIconGroup, Tooltip } from '@mantine/core';
import { useState } from 'react';
import { IoAdd, IoRefresh } from "react-icons/io5";

interface AddressTableProps {
    coinAccount: CoinAccount;
    fingerPrint: string;
}

const formatBalance = (balance: number) => {
    return (balance / 1e8).toFixed(2);
}

export const AddressTable = (props: AddressTableProps) => {
    const [numAddresses, setNumAddresses] = useState(1);
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
                    {
                        Array.from({ length: numAddresses }, (_, index) => (
                            <AddressRow key={index} masterFingerprint={props.fingerPrint} coinAccount={props.coinAccount} symbol={props.coinAccount.chain} addressIndex={index} />
                        ))
                    }
                    <TableTr>
                        <TableTd>
                            <Tooltip label="Next Address" openDelay={500}>
                                <ActionIcon>
                                    <IoAdd onClick={() => setNumAddresses(numAddresses + 1)} />
                                </ActionIcon>
                            </Tooltip>
                        </TableTd>
                        <TableTd></TableTd>
                        <TableTd></TableTd>
                    </TableTr>
                </TableTbody>
            </Table>
        </Paper>
    );
}


const AddressRow = (props: { masterFingerprint: string, coinAccount: CoinAccount, symbol: string, addressIndex: number }) => {
    const address = getSendableAddress(props.coinAccount, props.addressIndex);
    let useQueryHook;
    switch (props.symbol) {
        case 'BTC':
            useQueryHook = btcAPI.useCheckBalanceQuery;
            break;
        case 'RUNE':
            useQueryHook = thorApi.useCheckBalanceQuery;
            break;
    }

    const maybeQuery = useQueryHook?.({ fingerprint: props.masterFingerprint, derivationPath: props.coinAccount.derivationPath, accountIndex: props.coinAccount.index, addressIndex: props.addressIndex, address });
    const { data, refetch } = maybeQuery ?? { data: undefined, refetch: () => { } };
    0

    return data && (
        <TableTr key={props.addressIndex}>
            <TableTd>{props.addressIndex}</TableTd>
            <TableTd>
                <Text style={{ fontFamily: 'monospace' }}>
                    {address}
                </Text>
            </TableTd>
            <TableTd>
                {formatBalance(data.balance)} {props.symbol}
                <ActionIconGroup className='inline'>
                    <ActionIcon onClick={() => refetch()}><IoRefresh /></ActionIcon>
                </ActionIconGroup>
            </TableTd>
        </TableTr>
    );
}