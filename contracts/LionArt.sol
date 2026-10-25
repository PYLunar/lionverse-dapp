// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

library LionArt {
    function render(
        uint8 species,
        uint8 fur,
        uint8 mane,
        uint8 eyes
    ) internal pure returns (string memory) {
        string[6] memory furs = [
            '#DDAA55',
            '#F0DFC2',
            '#A7BED0',
            '#B47F65',
            '#C7B2D9',
            '#7D8897'
        ];
        string[3] memory manes = ['#9B603D', '#C98B36', '#594759'];
        string[4] memory eyeColors = ['#648958', '#78B7D2', '#C89B37', '#9973B8'];
        string memory fill = species >= 4 ? 'url(#special)' : manes[mane];
        return
            string.concat(
                '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 340">',
                species == 5 ? '<g style="filter:grayscale(1)">' : '<g>',
                '<defs><linearGradient id="special">',
                species == 5
                    ? '<stop stop-color="#171D29"/><stop offset=".5" stop-color="#FFFFFF"/><stop offset="1" stop-color="#171D29"/>'
                    : '<stop stop-color="#EB92BC"/><stop offset=".5" stop-color="#97B9F3"/><stop offset="1" stop-color="#A0DFBD"/>',
                '</linearGradient></defs><ellipse cx="180" cy="304" rx="86" ry="12" fill="#000" opacity=".08"/>',
                '<ellipse cx="180" cy="258" rx="58" ry="50" fill="',
                furs[fur],
                '"/>',
                '<circle cx="180" cy="150" r="104" fill="',
                fill,
                '"/>',
                mane == 2
                    ? '<path d="m96 90-12-40 48 17m132 23 12-40-48 17" fill="#A1B8C9"/>'
                    : '',
                '<circle cx="110" cy="100" r="24" fill="',
                furs[fur],
                '"/><circle cx="250" cy="100" r="24" fill="',
                furs[fur],
                '"/>',
                '<ellipse cx="180" cy="155" rx="76" ry="80" fill="',
                furs[fur],
                '"/>',
                '<ellipse cx="148" cy="146" rx="10" ry="14" fill="',
                eyeColors[eyes],
                '"/><ellipse cx="212" cy="146" rx="10" ry="14" fill="',
                eyeColors[eyes],
                '"/>',
                '<circle cx="150" cy="142" r="3" fill="white"/><circle cx="214" cy="142" r="3" fill="white"/>',
                '<ellipse cx="180" cy="190" rx="38" ry="25" fill="#FFF0D4"/><path d="m168 179 12 14 12-14z" fill="#49372E"/>',
                '<path d="M180 193v10m0 0q-12 10-21 0m21 0q12 10 21 0" fill="none" stroke="#49372E" stroke-width="3"/>',
                species == 1
                    ? '<path d="m148 241 16-7 16 10 16-10 16 7-13 35-19-10-19 10z" fill="#FFFFFF"/>'
                    : species == 2
                        ? '<circle cx="180" cy="261" r="19" fill="#E9B73E" stroke="#9B7227" stroke-width="3"/>'
                        : species == 3
                            ? '<path d="m155 253 25-17 25 17-25 34z" fill="#A9DEEF" stroke="#FFFFFF" stroke-width="3"/>'
                            : '',
                '</g></svg>'
            );
    }
}
