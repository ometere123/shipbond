import importlib.util
import json
import sys
import types
from pathlib import Path

import pytest


class _UserError(Exception):
    pass


class _Contract:
    pass


class _U256(int):
    pass


class _Decorator:
    def __call__(self, fn):
        return fn

    @property
    def payable(self):
        return self


def _load_contract_module():
    write = _Decorator()
    genlayer = types.ModuleType("genlayer")
    genlayer.gl = types.SimpleNamespace(
        Contract=_Contract,
        evm=types.SimpleNamespace(
            contract_interface=lambda cls: cls,
        ),
        public=types.SimpleNamespace(
            write=write,
            view=_Decorator(),
        ),
        vm=types.SimpleNamespace(UserError=_UserError),
    )
    genlayer.u256 = _U256
    genlayer.TreeMap = dict
    genlayer.Address = str
    sys.modules["genlayer"] = genlayer

    module_path = Path(__file__).resolve().parents[2] / "contracts" / "ShipBondProtocol.py"
    spec = importlib.util.spec_from_file_location("shipbond_contract_for_tests", module_path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def _base_refs():
    return {
        "repo_url": "https://github.com/ometere123/shipbond",
        "full_commit_hash": "0123456789abcdef0123456789abcdef01234567",
        "deployment_url": "https://shipbond.vercel.app",
        "read_result_summary": "README was fetched from the submitted commit.",
        "smoke_test_result": "Deployment loaded successfully.",
        "builder_explanation_summary": "Milestone implementation is complete.",
        "acceptance_criteria_checklist": ["README documents the delivered protocol"],
    }


def test_evidence_refs_derive_raw_readme_from_repo_and_commit():
    contract = _load_contract_module()

    refs = contract._parse_and_validate_evidence_refs(json.dumps(_base_refs()))

    assert refs["repo_url"] == "https://github.com/ometere123/shipbond"
    assert refs["readme_path"] == "README.md"
    assert refs["raw_readme_url"] == (
        "https://raw.githubusercontent.com/"
        "ometere123/shipbond/0123456789abcdef0123456789abcdef01234567/README.md"
    )


def test_evidence_refs_reject_raw_readme_from_different_repo():
    contract = _load_contract_module()
    refs = _base_refs()
    refs["raw_readme_url"] = (
        "https://raw.githubusercontent.com/"
        "other/repo/0123456789abcdef0123456789abcdef01234567/README.md"
    )

    with pytest.raises(_UserError, match="raw_readme_url must match"):
        contract._parse_and_validate_evidence_refs(json.dumps(refs))


def test_evidence_refs_reject_branch_raw_readme_instead_of_commit():
    contract = _load_contract_module()
    refs = _base_refs()
    refs["raw_readme_url"] = (
        "https://raw.githubusercontent.com/ometere123/shipbond/main/README.md"
    )

    with pytest.raises(_UserError, match="raw_readme_url must match"):
        contract._parse_and_validate_evidence_refs(json.dumps(refs))


def test_evidence_digest_is_canonical_and_detects_tampering():
    contract = _load_contract_module()
    refs = contract._parse_and_validate_evidence_refs(json.dumps(_base_refs()))

    digest = contract._compute_evidence_digest(refs)
    assert len(digest) == 64

    tampered = dict(refs)
    tampered["deployment_url"] = "https://example.com"
    assert contract._compute_evidence_digest(tampered) != digest
