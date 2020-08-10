import { Address, BigInt } from '@graphprotocol/graph-ts';
import { ItemStatusChange, GeneralizedTCR } from '../generated/GeneralizedTCR/GeneralizedTCR';
import { CuratedMarket } from '../generated/schema';
import { FixedProductMarketMaker } from '../generated/templates/FixedProductMarketMaker/FixedProductMarketMaker';
import { ItemTypes, gtcrDecode } from './gtcr-decode';

export function handleItemStatusChange(event: ItemStatusChange): void {
  const tcr = GeneralizedTCR.bind(event.address);
  const itemInfo = tcr.getItemInfo(event.params._itemID);
  const columns = [
    {
      "label": "Question",
      "type": ItemTypes.TEXT,
    },
    {
      "label": "Market URL",
      "type": ItemTypes.LINK,
    }
  ]; // This information can be found in metadata field of the TCR meta evidence.
  const decodedData = gtcrDecode({ columns, values: itemInfo.value0.toHexString() });

  // Regex taken from https://github.com/k4m4/ethereum-regex/tree/fa23691cb6a872d5994b1caa26f0d5eb2dea6a80
  const fpmmAddress = decodedData[1].match(/0x[a-fA-F0-9]{40}/g);
  if (!fpmmAddress) return; // Invalid submission. No Op

  const fpmm = FixedProductMarketMaker.bind(Address.fromString(fpmmAddress[0]));
  const conditionId = fpmm.conditionIds(new BigInt());

  const curatedMarket = new CuratedMarket(conditionId.toHexString());
  curatedMarket.status = itemInfo.value1;
  curatedMarket.fpmmAddress = fpmmAddress[0];
  curatedMarket.itemID = event.params._itemID.toHexString();
  curatedMarket.save();
}


