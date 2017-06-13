class checkSudoku {

    constructor(iInput) {
        let _newInput = this.transformInput(iInput)
        this.sumTotal = this.sumOfN ();
        this.blockSize = Math.sqrt(this.dimention);
        this.init(this.formMatrix(_newInput, this.dimention ))
        console.log(this.isSudokuRight());
    }

    sumOfN () {
        return ((Math.pow(this.dimention, 2)/2) + (this.dimention/2))
    }

    transformInput (iInput) {
        this.dimention = parseInt(iInput.substr(0,iInput.indexOf(';')));
        return iInput.substr(iInput.indexOf(';')+1,iInput.length).split(',')
    }

    // isInputValid () {
    //     if(length == Math.pow(this.dimention, 2)) {
    //         return true;
    //     }
    // }

    isSudokuRight() {
        return (this.validate(this.rows) && this.validate(this.cols) && this.validate(this.grid));
    }

    validate(data) {
        for (let row = 0; row < this.dimention; row++) {
            let sum = 0;
            for (let col = 0; col < this.dimention; col++) {
                sum = sum + parseInt(data[row][col]);
            }
            if (sum != this.sumOfN ())
                return false;
        }
        return true;
    }
    orderData(data) {
        this.rows = data;
        this.cols = [];
        this.grid = [];

        // Prefilling the structures with empty array objects
        for (var i = 0; i < this.dimention; i++) {
            this.cols.push([]);
            this.grid.push([]);
        }

        for (var row = 0; row < this.dimention; row++) {

            for (var col = 0; col < this.dimention; col++) {

                this.cols[col][row] = data[row][col];

                let gRow = Math.floor(row / this.blockSize);
                let gCol = Math.floor(col / this.blockSize);
                let gIndex = gRow * this.blockSize + gCol;

                this.grid[gIndex].push(data[row][col]);

            }
        }
    }

    formMatrix(iArray, iLen) {
        let chunks = [], i = 0, n = Math.pow(iLen, 2) ;

        while (i < n) {
            chunks.push(iArray.slice(i, i += iLen));
        }
        return chunks;
    }

    init(data) {
        this.orderData(data);
        return this;
    }
}

var _input = 
`9;5,3,4,6,7,8,9,1,2,6,7,2,1,9,5,3,4,8,1,9,8,3,4,2,5,6,7,8,5,9,7,6,1,4,2,3,4,2,6,8,5,3,7,9,1,7,1,3,9,2,4,8,5,6,9,6,1,5,3,7,2,8,4,
2,8,7,4,1,9,6,3,5,3,4,5,2,8,6,1,7,9`;

console.info(new checkSudoku(_input));
