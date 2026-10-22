// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @dev Small, entirely on-chain portrait. The web client renders a richer version.
library LionArt {
    function render(
        uint8 species,
        uint8 fur,
        uint8 mane,
        uint8 eyes,
        uint8 pattern,
        uint8 aura,
        uint8 crown
    ) internal pure returns (string memory) {
        string[6] memory coats = [
            string('#E6B86A'),
            '#F3DEB3',
            '#A9BEC9',
            '#BC8563',
            '#C8B8DC',
            '#596574'
        ];
        string[9] memory manes = [
            string('#9A5D32'),
            '#C78D47',
            '#657F88',
            '#663E35',
            '#87719E',
            '#363B4B',
            '#D86B3D',
            '#82C9D9',
            '#6F60B3'
        ];
        string[7] memory irises = [
            string('#729A67'),
            '#72A9C5',
            '#D49B39',
            '#9674B3',
            '#91BBAF',
            '#E6B750',
            '#BC97ED'
        ];
        string memory coat = species == 5
            ? '#E0E2E8'
            : species == 2
                ? 'url(#gold)'
                : species == 3
                    ? '#C7EBF5'
                    : coats[fur];
        string memory maneColor = species == 5
            ? 'url(#mono)'
            : species == 4
                ? 'url(#rainbow)'
                : manes[mane];
        return
            string.concat(
                '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300"',
                species == 5 ? ' style="filter:grayscale(1)">' : '>',
                '<defs><linearGradient id="mono"><stop stop-color="#141A29"/><stop offset=".4" stop-color="#FAFCFF"/><stop offset=".6" stop-color="#252C3B"/><stop offset="1" stop-color="#DCE3ED"/></linearGradient><linearGradient id="rainbow"><stop stop-color="#F1ABBD"/><stop offset=".3" stop-color="#DFBAEF"/><stop offset=".6" stop-color="#9EBDF0"/><stop offset="1" stop-color="#9EDFD7"/></linearGradient>',
                '<linearGradient id="gold"><stop stop-color="#B48125"/><stop offset=".5" stop-color="#FFF0AF"/><stop offset="1" stop-color="#D5A133"/></linearGradient></defs>',
                '<rect width="300" height="300" rx="28" fill="#EEEDE5"/>',
                aura == 0
                    ? ''
                    : '<ellipse cx="150" cy="147" rx="139" ry="65" fill="none" stroke="#BBA2D8" stroke-width="3" stroke-dasharray="5 6"/>',
                '<circle cx="150" cy="145" r="108" fill="',
                maneColor,
                '"/>',
                _mane(species, mane),
                '<ellipse cx="150" cy="245" rx="65" ry="67" fill="',
                coat,
                '"/>',
                '<circle cx="88" cy="96" r="27" fill="',
                coat,
                '"/>',
                '<circle cx="212" cy="96" r="27" fill="',
                coat,
                '"/>',
                '<ellipse cx="150" cy="148" rx="73" ry="80" fill="',
                coat,
                '"/>',
                '<ellipse cx="120" cy="139" rx="12" ry="14" fill="',
                irises[eyes],
                '"/>',
                '<ellipse cx="180" cy="139" rx="12" ry="14" fill="',
                eyes == 5 ? '#72A9C5' : irises[eyes],
                '"/>',
                '<g fill="#29352F"><ellipse cx="121" cy="139" rx="4" ry="10"/>',
                '<ellipse cx="179" cy="139" rx="4" ry="10"/></g>',
                eyes == 6
                    ? '<path d="m120 129 3 7 6 3-6 3-3 7-3-7-6-3 6-3zm60 0 3 7 6 3-6 3-3 7-3-7-6-3 6-3z" fill="#FFF4BE"/>'
                    : '',
                '<ellipse cx="133" cy="180" rx="23" ry="19" fill="#FFF1D7"/>',
                '<ellipse cx="167" cy="180" rx="23" ry="19" fill="#FFF1D7"/>',
                '<path d="M138 168h24l-12 14z" fill="#493A34"/>',
                pattern == 0
                    ? ''
                    : '<path d="M132 96l8 15m10-18v17m10-14-5 16" stroke="#493A34" stroke-opacity=".4" stroke-width="5" stroke-linecap="round"/>',
                _body(species),
                _crown(crown),
                '</svg>'
            );
    }

    function _mane(uint8 species, uint8 mane) private pure returns (string memory) {
        if (species == 3 || mane == 7)
            return
                '<path d="m48 120 11-58 44 13 24-51 25 28 35-28 24 51 44-13 11 58-22 65-29 46-59 22-59-22-29-46z" fill="#9ACFDF" stroke="#DEF8FF" stroke-width="3"/>';
        if (mane == 6)
            return
                '<path d="m43 149 18-74 22 20 12-58 30 24 24-44 26 44 29-24 13 58 21-20 19 74-24 63H67z" fill="#DE884A"/>';
        if (mane == 8)
            return
                '<ellipse cx="150" cy="145" rx="120" ry="110" fill="none" stroke="#CFB6ED" stroke-width="4"/>';
        return '';
    }

    function _body(uint8 species) private pure returns (string memory) {
        if (species == 5)
            return
                '<ellipse cx="150" cy="145" rx="125" ry="115" fill="none" stroke="#273040" stroke-width="3"/><circle cx="150" cy="30" r="19" fill="#202635" stroke="#E7EDFA" stroke-width="4"/><path d="m26 160 9-16 9 16-9 16zm232 48 9-16 9 16-9 16z" fill="url(#mono)"/>';
        if (species == 1)
            return
                '<path d="m124 228 13-9 13 9 13-9 13 9-11 31-15-11-15 11z" fill="#FFF7E9"/>';
        if (species == 2)
            return
                '<path d="m126 236 24-10 24 10-8 29-16 14-16-14z" fill="url(#gold)" stroke="#A97C25"/><circle cx="150" cy="99" r="8" fill="url(#gold)"/>';
        if (species == 3)
            return
                '<path d="m124 240 26-15 26 15-26 40zM86 86l-5-35 25 31m108 4 5-35-25 31" fill="#C4EDFF" stroke="#85BEDB" stroke-width="2"/><path d="m124 240 26 12 26-12m-26-15v55" fill="none" stroke="#85BEDB"/>';
        if (species == 4)
            return
                '<path d="M58 203Q7 137 35 92M242 203q51-66 23-111" fill="none" stroke="url(#rainbow)" stroke-width="8"/><path d="m25 196 8-15 8 15-8 15zm233-60 8-15 8 15-8 15z" fill="url(#rainbow)"/>';
        return '';
    }

    function _crown(uint8 crown) private pure returns (string memory) {
        if (crown == 1)
            return
                '<path d="m112 65 12 8 6-14 12 16 8-15 8 15 12-16 6 14 12-8" fill="none" stroke="#78995B" stroke-width="6"/>';
        if (crown == 2)
            return
                '<path d="m122 56 2-28 17 23 9-38 9 38 17-23 2 28z" fill="#D4F5FF" stroke="#83B5CE"/>';
        if (crown == 3)
            return
                '<ellipse cx="150" cy="25" rx="39" ry="9" fill="none" stroke="#E7BE60" stroke-width="5"/>';
        return '';
    }
}
