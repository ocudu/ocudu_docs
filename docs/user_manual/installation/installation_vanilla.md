First, clone srsRAN Project repository:

```bash
git clone https://github.com/srsRAN/srsRAN_Project.git
```

Then build the code-base:

```bash
cd srsRAN_Project
mkdir build
cd build
cmake ../
make -j $(nproc)
make test -j $(nproc)
```

You can now run the gNB from `srsRAN_Project/build/apps/gnb/`. If you wish to install srsRAN Project, you can use the following command:

```bash
sudo make install
```
