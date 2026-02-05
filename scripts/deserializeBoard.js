import {
    readMapFile,
    validateDimensions,
    mapCharacters,
    runLengthEncode,
    writeJsonMap
  } from '../src/map-parser/index.js';
  
  const inputFilePath = process.argv[2];
  if (!inputFilePath) {
    console.error('Usage: node runMap.js <input-map-file.txt> [output-map-file.json]');
    console.error('If [output-map-file.json] is not provided, the output will be input-map-file.json (same base name as input, .json extension).');
    process.exit(1);
  }
  const mapContent = await readMapFile(inputFilePath);
  
  try {
    // validate the dimensions
    validateDimensions(mapContent);
  
    // map the characters and compress the data using run-length encoding
    const glyphs = mapCharacters(mapContent);
    const mapData = runLengthEncode(glyphs);
  
    // write the data to a json file
    // Determine output file path: use second arg if provided, else replace .txt with .json in input file path
    let outputFilePath = process.argv[3];
    if (!outputFilePath) {
      outputFilePath = inputFilePath.replace(/\.txt$/i, '.json');
    }
    await writeJsonMap(mapData, outputFilePath);
  
    console.log(`Successfully processed ${inputFilePath} and wrote to ${outputFilePath}`);
  } catch (error) {
    console.error(`Unable to deserialize board txt file. Error processing ${inputFilePath}:`, error);
  }