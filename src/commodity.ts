import { Transfer, ERC721, NewJson, FakeToken } from "../generated/templates/ERC721/ERC721";
import { Token, Commodity } from "../generated/schema";
import { BigDecimal, BigInt, Address } from "@graphprotocol/graph-ts";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export function handleNewJson(event: NewJson): void {
    let token = Token.load(event.address.toHexString());
    let id = event.address.toHexString().concat("-").concat(event.params.tokenId.toString());

    let commodity = Commodity.load(id);

    if (commodity == null) {
        commodity = new Commodity(id);
    }

    commodity.token = token.id;
    commodity.tokenId = event.params.tokenId;

    let tokenNFT = ERC721.bind(event.address);
    let ref = tokenNFT.try_getRefById(event.params.tokenId);
    if (!ref.reverted) {
        commodity.reference = ref.value;
    } else {
        commodity.reference = "reverted";
    }

    commodity.isLive = true;
    commodity.isFake = false;
    commodity.metadata = event.params.json;

    commodity.nftCategory = token.nftCategory;

    commodity.save();
}

export function handleFakeToken(event: FakeToken): void {
    let id = event.address.toHexString().concat("-").concat(event.params.tokenId.toString());
    let commodity = Commodity.load(id);

    if (commodity != null) {
        commodity.isFake = true;
    }

    commodity.save();
}

export function getOneEther(): BigInt {
    let n = BigInt.fromI32(1);
    for(let i = 0; i < 18; i++) {
        n = n.times(BigInt.fromI32(10));
    }
    return n;
}