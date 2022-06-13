export type Namespaces = {
  version: "3.2.0";
  name: "namespaces";
  instructions: [
    {
      name: "init";
      accounts: [
        {
          name: "globalContext";
          isMut: true;
          isSigner: false;
        },
        {
          name: "authority";
          isMut: false;
          isSigner: true;
        },
        {
          name: "payer";
          isMut: true;
          isSigner: true;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: "ix";
          type: {
            defined: "InitGlobalContextIx";
          };
        }
      ];
    },
    {
      name: "updateGlobalContext";
      accounts: [
        {
          name: "globalContext";
          isMut: true;
          isSigner: false;
        },
        {
          name: "updateAuthority";
          isMut: false;
          isSigner: true;
        }
      ];
      args: [
        {
          name: "ix";
          type: {
            defined: "UpdateGlobalContextIx";
          };
        }
      ];
    },
    {
      name: "createNamespace";
      accounts: [
        {
          name: "namespace";
          isMut: true;
          isSigner: false;
        },
        {
          name: "authority";
          isMut: false;
          isSigner: false;
        },
        {
          name: "payer";
          isMut: true;
          isSigner: true;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: "ix";
          type: {
            defined: "CreateNamespaceIx";
          };
        }
      ];
    },
    {
      name: "updateNamespace";
      accounts: [
        {
          name: "namespace";
          isMut: true;
          isSigner: false;
        },
        {
          name: "updateAuthority";
          isMut: false;
          isSigner: true;
        }
      ];
      args: [
        {
          name: "ix";
          type: {
            defined: "UpdateNamespaceIx";
          };
        }
      ];
    },
    {
      name: "collectNamespaceFunds";
      accounts: [
        {
          name: "globalContext";
          isMut: false;
          isSigner: false;
        },
        {
          name: "globalContextPaymentAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "namespace";
          isMut: false;
          isSigner: false;
        },
        {
          name: "namespacePaymentAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "rentAuthority";
          isMut: false;
          isSigner: true;
        },
        {
          name: "rentAuthorityTokenAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "tokenProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: "amount";
          type: "u64";
        }
      ];
    },
    {
      name: "revokeReverseEntry";
      accounts: [
        {
          name: "namespace";
          isMut: false;
          isSigner: false;
        },
        {
          name: "entry";
          isMut: false;
          isSigner: false;
        },
        {
          name: "reverseEntry";
          isMut: true;
          isSigner: false;
        },
        {
          name: "claimRequest";
          isMut: true;
          isSigner: false;
        },
        {
          name: "invalidator";
          isMut: false;
          isSigner: true;
        }
      ];
      args: [];
    },
    {
      name: "setNamespaceReverseEntry";
      accounts: [
        {
          name: "namespace";
          isMut: false;
          isSigner: false;
        },
        {
          name: "entry";
          isMut: true;
          isSigner: false;
        },
        {
          name: "reverseEntry";
          isMut: true;
          isSigner: false;
        },
        {
          name: "userTokenAccount";
          isMut: false;
          isSigner: false;
        },
        {
          name: "tokenManager";
          isMut: false;
          isSigner: false;
        },
        {
          name: "user";
          isMut: true;
          isSigner: true;
        },
        {
          name: "payer";
          isMut: true;
          isSigner: true;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [];
    },
    {
      name: "invalidateManagedEntry";
      accounts: [
        {
          name: "namespace";
          isMut: false;
          isSigner: false;
        },
        {
          name: "entry";
          isMut: true;
          isSigner: false;
        },
        {
          name: "namespaceTokenAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "invalidator";
          isMut: false;
          isSigner: true;
        }
      ];
      args: [];
    },
    {
      name: "invalidateManagedReverseEntry";
      accounts: [
        {
          name: "namespace";
          isMut: false;
          isSigner: false;
        },
        {
          name: "entry";
          isMut: true;
          isSigner: false;
        },
        {
          name: "reverseEntry";
          isMut: true;
          isSigner: false;
        },
        {
          name: "namespaceTokenAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "invalidator";
          isMut: false;
          isSigner: true;
        }
      ];
      args: [];
    },
    {
      name: "invalidateUnmanagedEntry";
      accounts: [
        {
          name: "namespace";
          isMut: false;
          isSigner: false;
        },
        {
          name: "entry";
          isMut: true;
          isSigner: false;
        },
        {
          name: "tokenManager";
          isMut: false;
          isSigner: false;
        },
        {
          name: "invalidator";
          isMut: false;
          isSigner: true;
        }
      ];
      args: [];
    },
    {
      name: "invalidateUnmanagedReverseEntry";
      accounts: [
        {
          name: "namespace";
          isMut: false;
          isSigner: false;
        },
        {
          name: "entry";
          isMut: true;
          isSigner: false;
        },
        {
          name: "reverseEntry";
          isMut: true;
          isSigner: false;
        },
        {
          name: "tokenManager";
          isMut: false;
          isSigner: false;
        },
        {
          name: "invalidator";
          isMut: false;
          isSigner: true;
        }
      ];
      args: [];
    },
    {
      name: "claimEntryV2";
      accounts: [
        {
          name: "namespace";
          isMut: true;
          isSigner: false;
        },
        {
          name: "entry";
          isMut: true;
          isSigner: false;
        },
        {
          name: "requestor";
          isMut: true;
          isSigner: true;
        },
        {
          name: "recipient";
          isMut: true;
          isSigner: true;
        },
        {
          name: "payer";
          isMut: true;
          isSigner: true;
        },
        {
          name: "claimRequest";
          isMut: true;
          isSigner: false;
        },
        {
          name: "mint";
          isMut: true;
          isSigner: false;
        },
        {
          name: "namespaceTokenAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "tokenManager";
          isMut: true;
          isSigner: false;
        },
        {
          name: "tokenManagerTokenAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "mintCounter";
          isMut: true;
          isSigner: false;
        },
        {
          name: "recipientTokenAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "recipientPaymentTokenAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "tokenManagerProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "tokenProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "associatedToken";
          isMut: false;
          isSigner: false;
        },
        {
          name: "rent";
          isMut: false;
          isSigner: false;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: "ix";
          type: {
            defined: "ClaimEntryV2Ix";
          };
        }
      ];
    },
    {
      name: "invalidateEntry";
      accounts: [
        {
          name: "namespace";
          isMut: true;
          isSigner: false;
        },
        {
          name: "entry";
          isMut: true;
          isSigner: false;
        },
        {
          name: "claimRequest";
          isMut: true;
          isSigner: false;
        },
        {
          name: "invalidator";
          isMut: false;
          isSigner: true;
        },
        {
          name: "tokenManager";
          isMut: true;
          isSigner: false;
        },
        {
          name: "mint";
          isMut: true;
          isSigner: false;
        },
        {
          name: "tokenManagerTokenAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "userRecipientTokenAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "tokenManagerProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "tokenProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "rent";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [];
    },
    {
      name: "createClaimRequest";
      accounts: [
        {
          name: "namespace";
          isMut: false;
          isSigner: false;
        },
        {
          name: "payer";
          isMut: true;
          isSigner: true;
        },
        {
          name: "claimRequest";
          isMut: true;
          isSigner: false;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: "entryName";
          type: "string";
        },
        {
          name: "user";
          type: "publicKey";
        }
      ];
    },
    {
      name: "updateClaimRequest";
      accounts: [
        {
          name: "namespace";
          isMut: false;
          isSigner: false;
        },
        {
          name: "approveAuthority";
          isMut: false;
          isSigner: true;
        },
        {
          name: "rentRequest";
          isMut: true;
          isSigner: false;
        }
      ];
      args: [
        {
          name: "isApproved";
          type: "bool";
        }
      ];
    },
    {
      name: "updateEntryMintMetadata";
      accounts: [
        {
          name: "namespace";
          isMut: false;
          isSigner: false;
        },
        {
          name: "entry";
          isMut: false;
          isSigner: false;
        },
        {
          name: "updateAuthority";
          isMut: false;
          isSigner: true;
        },
        {
          name: "mintMetadata";
          isMut: true;
          isSigner: false;
        },
        {
          name: "tokenMetadataProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: "args";
          type: {
            defined: "UpdateEntryMintMetadataIx";
          };
        }
      ];
    },
    {
      name: "setEntryDataV2";
      accounts: [
        {
          name: "namespace";
          isMut: false;
          isSigner: false;
        },
        {
          name: "entry";
          isMut: true;
          isSigner: false;
        },
        {
          name: "userTokenAccount";
          isMut: false;
          isSigner: false;
        },
        {
          name: "tokenManager";
          isMut: false;
          isSigner: false;
        },
        {
          name: "user";
          isMut: true;
          isSigner: true;
        }
      ];
      args: [];
    },
    {
      name: "initEntry";
      accounts: [
        {
          name: "namespace";
          isMut: false;
          isSigner: false;
        },
        {
          name: "entry";
          isMut: true;
          isSigner: false;
        },
        {
          name: "payer";
          isMut: true;
          isSigner: true;
        },
        {
          name: "namespaceCertificateTokenAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "mintManager";
          isMut: true;
          isSigner: false;
        },
        {
          name: "certificateMint";
          isMut: true;
          isSigner: false;
        },
        {
          name: "certificateMintMetadata";
          isMut: true;
          isSigner: false;
        },
        {
          name: "certificateProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "tokenMetadataProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "tokenProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "associatedToken";
          isMut: false;
          isSigner: false;
        },
        {
          name: "rent";
          isMut: false;
          isSigner: false;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: "ix";
          type: {
            defined: "InitEntryIx";
          };
        }
      ];
    },
    {
      name: "claimEntry";
      accounts: [
        {
          name: "namespace";
          isMut: true;
          isSigner: false;
        },
        {
          name: "entry";
          isMut: true;
          isSigner: false;
        },
        {
          name: "user";
          isMut: true;
          isSigner: true;
        },
        {
          name: "payer";
          isMut: true;
          isSigner: true;
        },
        {
          name: "claimRequest";
          isMut: true;
          isSigner: false;
        },
        {
          name: "paymentMint";
          isMut: true;
          isSigner: false;
        },
        {
          name: "namespaceCertificateTokenAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "mintManager";
          isMut: true;
          isSigner: false;
        },
        {
          name: "certificate";
          isMut: true;
          isSigner: false;
        },
        {
          name: "certificateMint";
          isMut: true;
          isSigner: false;
        },
        {
          name: "certificateTokenAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "certificatePaymentTokenAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "userCertificateTokenAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "userPaymentTokenAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "certificateProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "tokenProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "associatedToken";
          isMut: false;
          isSigner: false;
        },
        {
          name: "rent";
          isMut: false;
          isSigner: false;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: "ix";
          type: {
            defined: "ClaimEntryIx";
          };
        }
      ];
    },
    {
      name: "setEntryData";
      accounts: [
        {
          name: "namespace";
          isMut: false;
          isSigner: false;
        },
        {
          name: "entry";
          isMut: true;
          isSigner: false;
        },
        {
          name: "userCertificateTokenAccount";
          isMut: false;
          isSigner: false;
        },
        {
          name: "certificate";
          isMut: false;
          isSigner: false;
        },
        {
          name: "user";
          isMut: true;
          isSigner: true;
        },
        {
          name: "payer";
          isMut: false;
          isSigner: true;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: "data";
          type: "publicKey";
        }
      ];
    },
    {
      name: "setReverseEntry";
      accounts: [
        {
          name: "namespace";
          isMut: false;
          isSigner: false;
        },
        {
          name: "entry";
          isMut: true;
          isSigner: false;
        },
        {
          name: "reverseEntry";
          isMut: true;
          isSigner: false;
        },
        {
          name: "userCertificateTokenAccount";
          isMut: false;
          isSigner: false;
        },
        {
          name: "certificate";
          isMut: false;
          isSigner: false;
        },
        {
          name: "user";
          isMut: true;
          isSigner: true;
        },
        {
          name: "payer";
          isMut: true;
          isSigner: true;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: "reverseEntryBump";
          type: "u8";
        }
      ];
    },
    {
      name: "revokeEntry";
      accounts: [
        {
          name: "namespace";
          isMut: true;
          isSigner: false;
        },
        {
          name: "entry";
          isMut: true;
          isSigner: false;
        },
        {
          name: "claimRequest";
          isMut: true;
          isSigner: false;
        },
        {
          name: "namespaceCertificateTokenAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "namespacePaymentTokenAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "invalidator";
          isMut: false;
          isSigner: true;
        },
        {
          name: "mintManager";
          isMut: true;
          isSigner: false;
        },
        {
          name: "certificate";
          isMut: true;
          isSigner: false;
        },
        {
          name: "certificateMint";
          isMut: true;
          isSigner: false;
        },
        {
          name: "certificateTokenAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "certificatePaymentTokenAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "userCertificateTokenAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "userPaymentTokenAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "certificateProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "tokenProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [];
    }
  ];
  accounts: [
    {
      name: "globalContext";
      type: {
        kind: "struct";
        fields: [
          {
            name: "bump";
            type: "u8";
          },
          {
            name: "updateAuthority";
            type: "publicKey";
          },
          {
            name: "rentAuthority";
            type: "publicKey";
          },
          {
            name: "feeBasisPoints";
            type: "u64";
          }
        ];
      };
    },
    {
      name: "namespace";
      type: {
        kind: "struct";
        fields: [
          {
            name: "bump";
            type: "u8";
          },
          {
            name: "name";
            type: "string";
          },
          {
            name: "updateAuthority";
            type: "publicKey";
          },
          {
            name: "rentAuthority";
            type: "publicKey";
          },
          {
            name: "approveAuthority";
            type: {
              option: "publicKey";
            };
          },
          {
            name: "schema";
            type: "u8";
          },
          {
            name: "paymentAmountDaily";
            type: "u64";
          },
          {
            name: "paymentMint";
            type: "publicKey";
          },
          {
            name: "minRentalSeconds";
            type: "i64";
          },
          {
            name: "maxRentalSeconds";
            type: {
              option: "i64";
            };
          },
          {
            name: "transferableEntries";
            type: "bool";
          }
        ];
      };
    },
    {
      name: "claimRequest";
      type: {
        kind: "struct";
        fields: [
          {
            name: "bump";
            type: "u8";
          },
          {
            name: "requestor";
            type: "publicKey";
          },
          {
            name: "isApproved";
            type: "bool";
          },
          {
            name: "namespace";
            type: "publicKey";
          },
          {
            name: "entryName";
            type: "string";
          }
        ];
      };
    },
    {
      name: "entry";
      type: {
        kind: "struct";
        fields: [
          {
            name: "bump";
            type: "u8";
          },
          {
            name: "namespace";
            type: "publicKey";
          },
          {
            name: "name";
            type: "string";
          },
          {
            name: "data";
            type: {
              option: "publicKey";
            };
          },
          {
            name: "reverseEntry";
            type: {
              option: "publicKey";
            };
          },
          {
            name: "mint";
            type: "publicKey";
          },
          {
            name: "isClaimed";
            type: "bool";
          }
        ];
      };
    },
    {
      name: "reverseEntry";
      type: {
        kind: "struct";
        fields: [
          {
            name: "bump";
            type: "u8";
          },
          {
            name: "entryName";
            type: "string";
          },
          {
            name: "namespaceName";
            type: "string";
          }
        ];
      };
    }
  ];
  types: [
    {
      name: "ClaimEntryIx";
      type: {
        kind: "struct";
        fields: [
          {
            name: "duration";
            type: {
              option: "i64";
            };
          },
          {
            name: "certificateBump";
            type: "u8";
          }
        ];
      };
    },
    {
      name: "ClaimEntryV2Ix";
      type: {
        kind: "struct";
        fields: [
          {
            name: "duration";
            type: {
              option: "i64";
            };
          }
        ];
      };
    },
    {
      name: "CreateNamespaceIx";
      type: {
        kind: "struct";
        fields: [
          {
            name: "bump";
            type: "u8";
          },
          {
            name: "name";
            type: "string";
          },
          {
            name: "updateAuthority";
            type: "publicKey";
          },
          {
            name: "rentAuthority";
            type: "publicKey";
          },
          {
            name: "approveAuthority";
            type: {
              option: "publicKey";
            };
          },
          {
            name: "schema";
            type: "u8";
          },
          {
            name: "paymentAmountDaily";
            type: "u64";
          },
          {
            name: "paymentMint";
            type: "publicKey";
          },
          {
            name: "minRentalSeconds";
            type: "i64";
          },
          {
            name: "maxRentalSeconds";
            type: {
              option: "i64";
            };
          },
          {
            name: "transferableEntries";
            type: "bool";
          }
        ];
      };
    },
    {
      name: "InitEntryIx";
      type: {
        kind: "struct";
        fields: [
          {
            name: "name";
            type: "string";
          },
          {
            name: "entryBump";
            type: "u8";
          },
          {
            name: "mintManagerBump";
            type: "u8";
          }
        ];
      };
    },
    {
      name: "InitGlobalContextIx";
      type: {
        kind: "struct";
        fields: [
          {
            name: "feeBasisPoints";
            type: "u64";
          }
        ];
      };
    },
    {
      name: "InitMintIx";
      type: {
        kind: "struct";
        fields: [
          {
            name: "sellerFeeBasisPoints";
            type: "u16";
          },
          {
            name: "creators";
            type: {
              option: {
                vec: {
                  defined: "Creator";
                };
              };
            };
          },
          {
            name: "primarySaleHappened";
            type: {
              option: "bool";
            };
          }
        ];
      };
    },
    {
      name: "Creator";
      type: {
        kind: "struct";
        fields: [
          {
            name: "address";
            type: "publicKey";
          },
          {
            name: "verified";
            type: "bool";
          },
          {
            name: "share";
            type: "u8";
          }
        ];
      };
    },
    {
      name: "InitNameEntryIx";
      type: {
        kind: "struct";
        fields: [
          {
            name: "name";
            type: "string";
          }
        ];
      };
    },
    {
      name: "UpdateEntryMintMetadataIx";
      type: {
        kind: "struct";
        fields: [
          {
            name: "sellerFeeBasisPoints";
            type: "u16";
          },
          {
            name: "creators";
            type: {
              option: {
                vec: {
                  defined: "Creator";
                };
              };
            };
          },
          {
            name: "primarySaleHappened";
            type: {
              option: "bool";
            };
          }
        ];
      };
    },
    {
      name: "UpdateGlobalContextIx";
      type: {
        kind: "struct";
        fields: [
          {
            name: "updateAuthority";
            type: {
              option: "publicKey";
            };
          },
          {
            name: "rentAuthority";
            type: {
              option: "publicKey";
            };
          },
          {
            name: "feeBasisPoints";
            type: {
              option: "u64";
            };
          }
        ];
      };
    },
    {
      name: "UpdateNamespaceIx";
      type: {
        kind: "struct";
        fields: [
          {
            name: "updateAuthority";
            type: "publicKey";
          },
          {
            name: "rentAuthority";
            type: "publicKey";
          },
          {
            name: "approveAuthority";
            type: {
              option: "publicKey";
            };
          },
          {
            name: "paymentAmountDaily";
            type: "u64";
          },
          {
            name: "paymentMint";
            type: "publicKey";
          },
          {
            name: "minRentalSeconds";
            type: "i64";
          },
          {
            name: "maxRentalSeconds";
            type: {
              option: "i64";
            };
          },
          {
            name: "transferableEntries";
            type: "bool";
          }
        ];
      };
    }
  ];
  errors: [
    {
      code: 6000;
      name: "InvalidOwnerMint";
      msg: "Owner mint is invalid";
    },
    {
      code: 6001;
      name: "EntryNotExpired";
      msg: "Entry has not expired";
    },
    {
      code: 6002;
      name: "RentalDurationTooSmall";
      msg: "Rental duration too small try adding more funds";
    },
    {
      code: 6003;
      name: "RentalDurationTooLarge";
      msg: "Rental duration too large try adding less funds";
    },
    {
      code: 6004;
      name: "NamespaceRequiresDuration";
      msg: "Namespace requires duration";
    },
    {
      code: 6005;
      name: "InvalidAuthority";
      msg: "Authority is invalid";
    },
    {
      code: 6006;
      name: "InvalidAuthorityTokenAccount";
      msg: "Invalid authorty token account";
    },
    {
      code: 6007;
      name: "InvalidNamespacePaymentAccount";
      msg: "Invalid namespace payment account";
    },
    {
      code: 6008;
      name: "InvalidGlobalContextPaymentAccount";
      msg: "Invalid global context payment account";
    },
    {
      code: 6009;
      name: "InvalidNamespace";
      msg: "Invalid namespace";
    },
    {
      code: 6010;
      name: "InvalidEntry";
      msg: "Invalid entry";
    },
    {
      code: 6011;
      name: "InvalidCertificate";
      msg: "Invalid certificate";
    },
    {
      code: 6012;
      name: "InvalidPaymentMint";
      msg: "Invalid payment mint";
    },
    {
      code: 6013;
      name: "InvalidReverseEntry";
      msg: "Invalid reverse entry";
    },
    {
      code: 6014;
      name: "ClaimNotAllowed";
      msg: "Claim not allowed";
    },
    {
      code: 6015;
      name: "InvalidApproveAuthority";
      msg: "Invalid approve authority";
    },
    {
      code: 6016;
      name: "NamespaceRequiresToken";
      msg: "Namespace requires token";
    },
    {
      code: 6017;
      name: "MintAlreadyInitialized";
      msg: "Mint already initialized";
    },
    {
      code: 6018;
      name: "InvalidEntryMint";
      msg: "Mint invalid for entry";
    },
    {
      code: 6019;
      name: "InvalidTimeInvalidatorProgramId";
      msg: "Time invalidator program ID is invalid";
    },
    {
      code: 6020;
      name: "InvalidTokenManager";
      msg: "Invalid token manager";
    }
  ];
};

export const IDL: Namespaces = {
  version: "3.2.0",
  name: "namespaces",
  instructions: [
    {
      name: "init",
      accounts: [
        {
          name: "globalContext",
          isMut: true,
          isSigner: false,
        },
        {
          name: "authority",
          isMut: false,
          isSigner: true,
        },
        {
          name: "payer",
          isMut: true,
          isSigner: true,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "ix",
          type: {
            defined: "InitGlobalContextIx",
          },
        },
      ],
    },
    {
      name: "updateGlobalContext",
      accounts: [
        {
          name: "globalContext",
          isMut: true,
          isSigner: false,
        },
        {
          name: "updateAuthority",
          isMut: false,
          isSigner: true,
        },
      ],
      args: [
        {
          name: "ix",
          type: {
            defined: "UpdateGlobalContextIx",
          },
        },
      ],
    },
    {
      name: "createNamespace",
      accounts: [
        {
          name: "namespace",
          isMut: true,
          isSigner: false,
        },
        {
          name: "authority",
          isMut: false,
          isSigner: false,
        },
        {
          name: "payer",
          isMut: true,
          isSigner: true,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "ix",
          type: {
            defined: "CreateNamespaceIx",
          },
        },
      ],
    },
    {
      name: "updateNamespace",
      accounts: [
        {
          name: "namespace",
          isMut: true,
          isSigner: false,
        },
        {
          name: "updateAuthority",
          isMut: false,
          isSigner: true,
        },
      ],
      args: [
        {
          name: "ix",
          type: {
            defined: "UpdateNamespaceIx",
          },
        },
      ],
    },
    {
      name: "collectNamespaceFunds",
      accounts: [
        {
          name: "globalContext",
          isMut: false,
          isSigner: false,
        },
        {
          name: "globalContextPaymentAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "namespace",
          isMut: false,
          isSigner: false,
        },
        {
          name: "namespacePaymentAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "rentAuthority",
          isMut: false,
          isSigner: true,
        },
        {
          name: "rentAuthorityTokenAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "amount",
          type: "u64",
        },
      ],
    },
    {
      name: "revokeReverseEntry",
      accounts: [
        {
          name: "namespace",
          isMut: false,
          isSigner: false,
        },
        {
          name: "entry",
          isMut: false,
          isSigner: false,
        },
        {
          name: "reverseEntry",
          isMut: true,
          isSigner: false,
        },
        {
          name: "claimRequest",
          isMut: true,
          isSigner: false,
        },
        {
          name: "invalidator",
          isMut: false,
          isSigner: true,
        },
      ],
      args: [],
    },
    {
      name: "setNamespaceReverseEntry",
      accounts: [
        {
          name: "namespace",
          isMut: false,
          isSigner: false,
        },
        {
          name: "entry",
          isMut: true,
          isSigner: false,
        },
        {
          name: "reverseEntry",
          isMut: true,
          isSigner: false,
        },
        {
          name: "userTokenAccount",
          isMut: false,
          isSigner: false,
        },
        {
          name: "tokenManager",
          isMut: false,
          isSigner: false,
        },
        {
          name: "user",
          isMut: true,
          isSigner: true,
        },
        {
          name: "payer",
          isMut: true,
          isSigner: true,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [],
    },
    {
      name: "invalidateManagedEntry",
      accounts: [
        {
          name: "namespace",
          isMut: false,
          isSigner: false,
        },
        {
          name: "entry",
          isMut: true,
          isSigner: false,
        },
        {
          name: "namespaceTokenAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "invalidator",
          isMut: false,
          isSigner: true,
        },
      ],
      args: [],
    },
    {
      name: "invalidateManagedReverseEntry",
      accounts: [
        {
          name: "namespace",
          isMut: false,
          isSigner: false,
        },
        {
          name: "entry",
          isMut: true,
          isSigner: false,
        },
        {
          name: "reverseEntry",
          isMut: true,
          isSigner: false,
        },
        {
          name: "namespaceTokenAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "invalidator",
          isMut: false,
          isSigner: true,
        },
      ],
      args: [],
    },
    {
      name: "invalidateUnmanagedEntry",
      accounts: [
        {
          name: "namespace",
          isMut: false,
          isSigner: false,
        },
        {
          name: "entry",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenManager",
          isMut: false,
          isSigner: false,
        },
        {
          name: "invalidator",
          isMut: false,
          isSigner: true,
        },
      ],
      args: [],
    },
    {
      name: "invalidateUnmanagedReverseEntry",
      accounts: [
        {
          name: "namespace",
          isMut: false,
          isSigner: false,
        },
        {
          name: "entry",
          isMut: true,
          isSigner: false,
        },
        {
          name: "reverseEntry",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenManager",
          isMut: false,
          isSigner: false,
        },
        {
          name: "invalidator",
          isMut: false,
          isSigner: true,
        },
      ],
      args: [],
    },
    {
      name: "claimEntryV2",
      accounts: [
        {
          name: "namespace",
          isMut: true,
          isSigner: false,
        },
        {
          name: "entry",
          isMut: true,
          isSigner: false,
        },
        {
          name: "requestor",
          isMut: true,
          isSigner: true,
        },
        {
          name: "recipient",
          isMut: true,
          isSigner: true,
        },
        {
          name: "payer",
          isMut: true,
          isSigner: true,
        },
        {
          name: "claimRequest",
          isMut: true,
          isSigner: false,
        },
        {
          name: "mint",
          isMut: true,
          isSigner: false,
        },
        {
          name: "namespaceTokenAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenManager",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenManagerTokenAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "mintCounter",
          isMut: true,
          isSigner: false,
        },
        {
          name: "recipientTokenAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "recipientPaymentTokenAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenManagerProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "associatedToken",
          isMut: false,
          isSigner: false,
        },
        {
          name: "rent",
          isMut: false,
          isSigner: false,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "ix",
          type: {
            defined: "ClaimEntryV2Ix",
          },
        },
      ],
    },
    {
      name: "invalidateEntry",
      accounts: [
        {
          name: "namespace",
          isMut: true,
          isSigner: false,
        },
        {
          name: "entry",
          isMut: true,
          isSigner: false,
        },
        {
          name: "claimRequest",
          isMut: true,
          isSigner: false,
        },
        {
          name: "invalidator",
          isMut: false,
          isSigner: true,
        },
        {
          name: "tokenManager",
          isMut: true,
          isSigner: false,
        },
        {
          name: "mint",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenManagerTokenAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "userRecipientTokenAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenManagerProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "rent",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [],
    },
    {
      name: "createClaimRequest",
      accounts: [
        {
          name: "namespace",
          isMut: false,
          isSigner: false,
        },
        {
          name: "payer",
          isMut: true,
          isSigner: true,
        },
        {
          name: "claimRequest",
          isMut: true,
          isSigner: false,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "entryName",
          type: "string",
        },
        {
          name: "user",
          type: "publicKey",
        },
      ],
    },
    {
      name: "updateClaimRequest",
      accounts: [
        {
          name: "namespace",
          isMut: false,
          isSigner: false,
        },
        {
          name: "approveAuthority",
          isMut: false,
          isSigner: true,
        },
        {
          name: "rentRequest",
          isMut: true,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "isApproved",
          type: "bool",
        },
      ],
    },
    {
      name: "updateEntryMintMetadata",
      accounts: [
        {
          name: "namespace",
          isMut: false,
          isSigner: false,
        },
        {
          name: "entry",
          isMut: false,
          isSigner: false,
        },
        {
          name: "updateAuthority",
          isMut: false,
          isSigner: true,
        },
        {
          name: "mintMetadata",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenMetadataProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "args",
          type: {
            defined: "UpdateEntryMintMetadataIx",
          },
        },
      ],
    },
    {
      name: "setEntryDataV2",
      accounts: [
        {
          name: "namespace",
          isMut: false,
          isSigner: false,
        },
        {
          name: "entry",
          isMut: true,
          isSigner: false,
        },
        {
          name: "userTokenAccount",
          isMut: false,
          isSigner: false,
        },
        {
          name: "tokenManager",
          isMut: false,
          isSigner: false,
        },
        {
          name: "user",
          isMut: true,
          isSigner: true,
        },
      ],
      args: [],
    },
    {
      name: "initEntry",
      accounts: [
        {
          name: "namespace",
          isMut: false,
          isSigner: false,
        },
        {
          name: "entry",
          isMut: true,
          isSigner: false,
        },
        {
          name: "payer",
          isMut: true,
          isSigner: true,
        },
        {
          name: "namespaceCertificateTokenAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "mintManager",
          isMut: true,
          isSigner: false,
        },
        {
          name: "certificateMint",
          isMut: true,
          isSigner: false,
        },
        {
          name: "certificateMintMetadata",
          isMut: true,
          isSigner: false,
        },
        {
          name: "certificateProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "tokenMetadataProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "associatedToken",
          isMut: false,
          isSigner: false,
        },
        {
          name: "rent",
          isMut: false,
          isSigner: false,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "ix",
          type: {
            defined: "InitEntryIx",
          },
        },
      ],
    },
    {
      name: "claimEntry",
      accounts: [
        {
          name: "namespace",
          isMut: true,
          isSigner: false,
        },
        {
          name: "entry",
          isMut: true,
          isSigner: false,
        },
        {
          name: "user",
          isMut: true,
          isSigner: true,
        },
        {
          name: "payer",
          isMut: true,
          isSigner: true,
        },
        {
          name: "claimRequest",
          isMut: true,
          isSigner: false,
        },
        {
          name: "paymentMint",
          isMut: true,
          isSigner: false,
        },
        {
          name: "namespaceCertificateTokenAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "mintManager",
          isMut: true,
          isSigner: false,
        },
        {
          name: "certificate",
          isMut: true,
          isSigner: false,
        },
        {
          name: "certificateMint",
          isMut: true,
          isSigner: false,
        },
        {
          name: "certificateTokenAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "certificatePaymentTokenAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "userCertificateTokenAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "userPaymentTokenAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "certificateProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "associatedToken",
          isMut: false,
          isSigner: false,
        },
        {
          name: "rent",
          isMut: false,
          isSigner: false,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "ix",
          type: {
            defined: "ClaimEntryIx",
          },
        },
      ],
    },
    {
      name: "setEntryData",
      accounts: [
        {
          name: "namespace",
          isMut: false,
          isSigner: false,
        },
        {
          name: "entry",
          isMut: true,
          isSigner: false,
        },
        {
          name: "userCertificateTokenAccount",
          isMut: false,
          isSigner: false,
        },
        {
          name: "certificate",
          isMut: false,
          isSigner: false,
        },
        {
          name: "user",
          isMut: true,
          isSigner: true,
        },
        {
          name: "payer",
          isMut: false,
          isSigner: true,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "data",
          type: "publicKey",
        },
      ],
    },
    {
      name: "setReverseEntry",
      accounts: [
        {
          name: "namespace",
          isMut: false,
          isSigner: false,
        },
        {
          name: "entry",
          isMut: true,
          isSigner: false,
        },
        {
          name: "reverseEntry",
          isMut: true,
          isSigner: false,
        },
        {
          name: "userCertificateTokenAccount",
          isMut: false,
          isSigner: false,
        },
        {
          name: "certificate",
          isMut: false,
          isSigner: false,
        },
        {
          name: "user",
          isMut: true,
          isSigner: true,
        },
        {
          name: "payer",
          isMut: true,
          isSigner: true,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "reverseEntryBump",
          type: "u8",
        },
      ],
    },
    {
      name: "revokeEntry",
      accounts: [
        {
          name: "namespace",
          isMut: true,
          isSigner: false,
        },
        {
          name: "entry",
          isMut: true,
          isSigner: false,
        },
        {
          name: "claimRequest",
          isMut: true,
          isSigner: false,
        },
        {
          name: "namespaceCertificateTokenAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "namespacePaymentTokenAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "invalidator",
          isMut: false,
          isSigner: true,
        },
        {
          name: "mintManager",
          isMut: true,
          isSigner: false,
        },
        {
          name: "certificate",
          isMut: true,
          isSigner: false,
        },
        {
          name: "certificateMint",
          isMut: true,
          isSigner: false,
        },
        {
          name: "certificateTokenAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "certificatePaymentTokenAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "userCertificateTokenAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "userPaymentTokenAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "certificateProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [],
    },
  ],
  accounts: [
    {
      name: "globalContext",
      type: {
        kind: "struct",
        fields: [
          {
            name: "bump",
            type: "u8",
          },
          {
            name: "updateAuthority",
            type: "publicKey",
          },
          {
            name: "rentAuthority",
            type: "publicKey",
          },
          {
            name: "feeBasisPoints",
            type: "u64",
          },
        ],
      },
    },
    {
      name: "namespace",
      type: {
        kind: "struct",
        fields: [
          {
            name: "bump",
            type: "u8",
          },
          {
            name: "name",
            type: "string",
          },
          {
            name: "updateAuthority",
            type: "publicKey",
          },
          {
            name: "rentAuthority",
            type: "publicKey",
          },
          {
            name: "approveAuthority",
            type: {
              option: "publicKey",
            },
          },
          {
            name: "schema",
            type: "u8",
          },
          {
            name: "paymentAmountDaily",
            type: "u64",
          },
          {
            name: "paymentMint",
            type: "publicKey",
          },
          {
            name: "minRentalSeconds",
            type: "i64",
          },
          {
            name: "maxRentalSeconds",
            type: {
              option: "i64",
            },
          },
          {
            name: "transferableEntries",
            type: "bool",
          },
        ],
      },
    },
    {
      name: "claimRequest",
      type: {
        kind: "struct",
        fields: [
          {
            name: "bump",
            type: "u8",
          },
          {
            name: "requestor",
            type: "publicKey",
          },
          {
            name: "isApproved",
            type: "bool",
          },
          {
            name: "namespace",
            type: "publicKey",
          },
          {
            name: "entryName",
            type: "string",
          },
        ],
      },
    },
    {
      name: "entry",
      type: {
        kind: "struct",
        fields: [
          {
            name: "bump",
            type: "u8",
          },
          {
            name: "namespace",
            type: "publicKey",
          },
          {
            name: "name",
            type: "string",
          },
          {
            name: "data",
            type: {
              option: "publicKey",
            },
          },
          {
            name: "reverseEntry",
            type: {
              option: "publicKey",
            },
          },
          {
            name: "mint",
            type: "publicKey",
          },
          {
            name: "isClaimed",
            type: "bool",
          },
        ],
      },
    },
    {
      name: "reverseEntry",
      type: {
        kind: "struct",
        fields: [
          {
            name: "bump",
            type: "u8",
          },
          {
            name: "entryName",
            type: "string",
          },
          {
            name: "namespaceName",
            type: "string",
          },
        ],
      },
    },
  ],
  types: [
    {
      name: "ClaimEntryIx",
      type: {
        kind: "struct",
        fields: [
          {
            name: "duration",
            type: {
              option: "i64",
            },
          },
          {
            name: "certificateBump",
            type: "u8",
          },
        ],
      },
    },
    {
      name: "ClaimEntryV2Ix",
      type: {
        kind: "struct",
        fields: [
          {
            name: "duration",
            type: {
              option: "i64",
            },
          },
        ],
      },
    },
    {
      name: "CreateNamespaceIx",
      type: {
        kind: "struct",
        fields: [
          {
            name: "bump",
            type: "u8",
          },
          {
            name: "name",
            type: "string",
          },
          {
            name: "updateAuthority",
            type: "publicKey",
          },
          {
            name: "rentAuthority",
            type: "publicKey",
          },
          {
            name: "approveAuthority",
            type: {
              option: "publicKey",
            },
          },
          {
            name: "schema",
            type: "u8",
          },
          {
            name: "paymentAmountDaily",
            type: "u64",
          },
          {
            name: "paymentMint",
            type: "publicKey",
          },
          {
            name: "minRentalSeconds",
            type: "i64",
          },
          {
            name: "maxRentalSeconds",
            type: {
              option: "i64",
            },
          },
          {
            name: "transferableEntries",
            type: "bool",
          },
        ],
      },
    },
    {
      name: "InitEntryIx",
      type: {
        kind: "struct",
        fields: [
          {
            name: "name",
            type: "string",
          },
          {
            name: "entryBump",
            type: "u8",
          },
          {
            name: "mintManagerBump",
            type: "u8",
          },
        ],
      },
    },
    {
      name: "InitGlobalContextIx",
      type: {
        kind: "struct",
        fields: [
          {
            name: "feeBasisPoints",
            type: "u64",
          },
        ],
      },
    },
    {
      name: "InitMintIx",
      type: {
        kind: "struct",
        fields: [
          {
            name: "sellerFeeBasisPoints",
            type: "u16",
          },
          {
            name: "creators",
            type: {
              option: {
                vec: {
                  defined: "Creator",
                },
              },
            },
          },
          {
            name: "primarySaleHappened",
            type: {
              option: "bool",
            },
          },
        ],
      },
    },
    {
      name: "Creator",
      type: {
        kind: "struct",
        fields: [
          {
            name: "address",
            type: "publicKey",
          },
          {
            name: "verified",
            type: "bool",
          },
          {
            name: "share",
            type: "u8",
          },
        ],
      },
    },
    {
      name: "InitNameEntryIx",
      type: {
        kind: "struct",
        fields: [
          {
            name: "name",
            type: "string",
          },
        ],
      },
    },
    {
      name: "UpdateEntryMintMetadataIx",
      type: {
        kind: "struct",
        fields: [
          {
            name: "sellerFeeBasisPoints",
            type: "u16",
          },
          {
            name: "creators",
            type: {
              option: {
                vec: {
                  defined: "Creator",
                },
              },
            },
          },
          {
            name: "primarySaleHappened",
            type: {
              option: "bool",
            },
          },
        ],
      },
    },
    {
      name: "UpdateGlobalContextIx",
      type: {
        kind: "struct",
        fields: [
          {
            name: "updateAuthority",
            type: {
              option: "publicKey",
            },
          },
          {
            name: "rentAuthority",
            type: {
              option: "publicKey",
            },
          },
          {
            name: "feeBasisPoints",
            type: {
              option: "u64",
            },
          },
        ],
      },
    },
    {
      name: "UpdateNamespaceIx",
      type: {
        kind: "struct",
        fields: [
          {
            name: "updateAuthority",
            type: "publicKey",
          },
          {
            name: "rentAuthority",
            type: "publicKey",
          },
          {
            name: "approveAuthority",
            type: {
              option: "publicKey",
            },
          },
          {
            name: "paymentAmountDaily",
            type: "u64",
          },
          {
            name: "paymentMint",
            type: "publicKey",
          },
          {
            name: "minRentalSeconds",
            type: "i64",
          },
          {
            name: "maxRentalSeconds",
            type: {
              option: "i64",
            },
          },
          {
            name: "transferableEntries",
            type: "bool",
          },
        ],
      },
    },
  ],
  errors: [
    {
      code: 6000,
      name: "InvalidOwnerMint",
      msg: "Owner mint is invalid",
    },
    {
      code: 6001,
      name: "EntryNotExpired",
      msg: "Entry has not expired",
    },
    {
      code: 6002,
      name: "RentalDurationTooSmall",
      msg: "Rental duration too small try adding more funds",
    },
    {
      code: 6003,
      name: "RentalDurationTooLarge",
      msg: "Rental duration too large try adding less funds",
    },
    {
      code: 6004,
      name: "NamespaceRequiresDuration",
      msg: "Namespace requires duration",
    },
    {
      code: 6005,
      name: "InvalidAuthority",
      msg: "Authority is invalid",
    },
    {
      code: 6006,
      name: "InvalidAuthorityTokenAccount",
      msg: "Invalid authorty token account",
    },
    {
      code: 6007,
      name: "InvalidNamespacePaymentAccount",
      msg: "Invalid namespace payment account",
    },
    {
      code: 6008,
      name: "InvalidGlobalContextPaymentAccount",
      msg: "Invalid global context payment account",
    },
    {
      code: 6009,
      name: "InvalidNamespace",
      msg: "Invalid namespace",
    },
    {
      code: 6010,
      name: "InvalidEntry",
      msg: "Invalid entry",
    },
    {
      code: 6011,
      name: "InvalidCertificate",
      msg: "Invalid certificate",
    },
    {
      code: 6012,
      name: "InvalidPaymentMint",
      msg: "Invalid payment mint",
    },
    {
      code: 6013,
      name: "InvalidReverseEntry",
      msg: "Invalid reverse entry",
    },
    {
      code: 6014,
      name: "ClaimNotAllowed",
      msg: "Claim not allowed",
    },
    {
      code: 6015,
      name: "InvalidApproveAuthority",
      msg: "Invalid approve authority",
    },
    {
      code: 6016,
      name: "NamespaceRequiresToken",
      msg: "Namespace requires token",
    },
    {
      code: 6017,
      name: "MintAlreadyInitialized",
      msg: "Mint already initialized",
    },
    {
      code: 6018,
      name: "InvalidEntryMint",
      msg: "Mint invalid for entry",
    },
    {
      code: 6019,
      name: "InvalidTimeInvalidatorProgramId",
      msg: "Time invalidator program ID is invalid",
    },
    {
      code: 6020,
      name: "InvalidTokenManager",
      msg: "Invalid token manager",
    },
  ],
};
