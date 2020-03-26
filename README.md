# NUS HTD

## Deployment
```bash
jiachen@r-122-98-25-172 htd % zip -r ../htd.zip .
jiachen@r-122-98-25-172 htd % aws lambda update-function-code --function-name nus-htd  --zip-file fileb://../htd.zip
```
