import { User } from "../generated/schema";
import { BigInt, Address } from "@graphprotocol/graph-ts";
import { NameService, CreateName } from "../generated/NameService/NameService";

export function handleCreateName(event: CreateName): void {
    createUserIfNull(event.params.wallet.toHexString());
}

export function createUserIfNull(userId: string): void {
    let user = User.load(userId);

    if (user == null) {
        user = new User(userId);
        user.bids = [];
        user.name = getNickname(userId);

        user.save();
    }
}

export function getNickname(walletAddress: string): string {
    let nameService = NameService.bind(Address.fromString("0xa235C036b75413e68f373BCa100bF818423Ee5B6"));
    let name = nameService.try_name(Address.fromString(walletAddress));

    if (!name.reverted) {
        return name.value;
    } else {
        return "reverted";
    }
}
